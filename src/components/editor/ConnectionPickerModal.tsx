import React, { useState, useMemo } from 'react';
import { usePatchStore } from '@/store/patchStore';
import { getModuleDefinition } from '@/lib/zoia/moduleLib';
import { Module, Connection } from '@/lib/zoia/types';

interface ConnectionPickerModalProps {
  sourceModule: Module;
  direction: 'input' | 'output'; // 'input': adding source -> module; 'output': adding module -> dest
  onSelect: (connection: Connection) => void;
  onClose: () => void;
}

export default function ConnectionPickerModal({ sourceModule, direction, onSelect, onClose }: ConnectionPickerModalProps) {
  const { patch } = usePatchStore();
  
  // 1. Determine Local Blocks
  // If direction='input', we need local blocks with direction 0 (Input).
  // If direction='output', we need local blocks with direction 1 (Output).
  const localDef = getModuleDefinition(sourceModule.typeId);
  const localBlocks = useMemo(() => {
    if (!localDef) return [];
    const allBlocks = localDef.calcBlocks({ blocks: localDef.blocks, options: sourceModule.options });
    return allBlocks.map((b, i) => ({ ...b, index: i })).filter(b => 
      direction === 'input' ? b.direction === 0 : b.direction === 1
    );
  }, [sourceModule, direction, localDef]);

  const [selectedLocalBlockIndex, setSelectedLocalBlockIndex] = useState<number>(localBlocks.length > 0 ? localBlocks[0].index : -1);

  // 2. Determine Remote Candidates
  // If direction='input', we need remote blocks with direction 1 (Output).
  // If direction='output', we need remote blocks with direction 0 (Input).
  const candidates = useMemo(() => {
    if (!patch) return [];
    const targetDir = direction === 'input' ? 1 : 0;
    
    // Group by Page -> Module -> Blocks
    const pages: { name: string; modules: { module: Module; blocks: { name: string; index: number }[] }[] }[] = [];
    
    patch.pageNames.forEach((pageName, pageIndex) => {
      const modsOnPage = patch.modules.filter(m => m.page === pageIndex && m.index !== sourceModule.index);
      if (modsOnPage.length === 0) return;

      const modulesWithBlocks: { module: Module; blocks: { name: string; index: number }[] }[] = [];
      
      modsOnPage.forEach(mod => {
        const def = getModuleDefinition(mod.typeId);
        if (!def) return;
        const blocks = def.calcBlocks({ blocks: def.blocks, options: mod.options });
        const compatibleBlocks = blocks.map((b, i) => ({ ...b, index: i })).filter(b => b.direction === targetDir);
        
        if (compatibleBlocks.length > 0) {
          modulesWithBlocks.push({
            module: mod,
            blocks: compatibleBlocks.map(b => ({ name: b.name, index: b.index }))
          });
        }
      });

      if (modulesWithBlocks.length > 0) {
        pages.push({ name: pageName, modules: modulesWithBlocks });
      }
    });
    
    return pages;
  }, [patch, sourceModule, direction]);

  const handleSelect = (remoteModule: Module, remoteBlockIndex: number) => {
    if (selectedLocalBlockIndex === -1) return;
    
    let connection: Connection;
    if (direction === 'input') {
      // Source = Remote, Dest = Local
      connection = {
        sourceModuleIndex: remoteModule.index,
        sourcePortIndex: remoteBlockIndex,
        destModuleIndex: sourceModule.index,
        destPortIndex: selectedLocalBlockIndex,
        strength: 100 // Default strength
      };
    } else {
      // Source = Local, Dest = Remote
      connection = {
        sourceModuleIndex: sourceModule.index,
        sourcePortIndex: selectedLocalBlockIndex,
        destModuleIndex: remoteModule.index,
        destPortIndex: remoteBlockIndex,
        strength: 100
      };
    }
    onSelect(connection);
  };

  if (localBlocks.length === 0) {
      return (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={onClose}>
             <div className="bg-gray-800 p-6 rounded shadow-lg text-white">
                 No compatible ports found on this module.
             </div>
         </div>
      )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-4">
            Add Connection ({direction === 'input' ? 'Input' : 'Output'})
        </h3>
        
        <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Local Port ({sourceModule.name || 'Module'})</label>
            <select 
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                value={selectedLocalBlockIndex}
                onChange={(e) => setSelectedLocalBlockIndex(Number(e.target.value))}
            >
                {localBlocks.map(b => (
                    <option key={b.index} value={b.index}>{b.name}</option>
                ))}
            </select>
        </div>

        <div className="flex-1 overflow-y-auto border border-gray-700 rounded bg-gray-900 p-2">
             {candidates.length === 0 && <div className="text-gray-500 p-4 text-center">No compatible modules found.</div>}
             {candidates.map((page, pi) => (
                 <div key={pi} className="mb-4">
                     <h4 className="text-xs font-bold text-violet-400 uppercase mb-2 sticky top-0 bg-gray-900 py-1">
                         {page.name} (Page {pi})
                     </h4>
                     <div className="pl-2 space-y-3">
                         {page.modules.map((m, mi) => (
                             <div key={mi}>
                                 <div className="text-sm text-white font-medium mb-1">{m.module.name || getModuleDefinition(m.module.typeId)?.name}</div>
                                 <div className="grid grid-cols-2 gap-2">
                                     {m.blocks.map(b => (
                                         <button 
                                             key={b.index}
                                             onClick={() => handleSelect(m.module, b.index)}
                                             className="text-left text-xs bg-gray-800 hover:bg-violet-900 border border-gray-700 hover:border-violet-500 p-2 rounded transition-colors"
                                         >
                                             {b.name}
                                         </button>
                                     ))}
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             ))}
        </div>

        <div className="mt-4 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
        </div>
      </div>
    </div>
  );
}
