import React, { useState } from 'react';
import { usePatchStore } from '@/store/patchStore';
import { getModuleDefinition } from '@/lib/zoia/moduleLib';

export default function StarredSection() {
  const { patch, setSelectedModuleIndex, setActivePage } = usePatchStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!patch) {
    return null;
  }
  
  const starredElements = patch.starredElements || [];

  const handleNavigate = (moduleIndex: number) => {
    const mod = patch.modules.find(m => m.index === moduleIndex);
    if (mod) {
      setActivePage(mod.page);
      setSelectedModuleIndex(moduleIndex);
    }
  };

  const getCcDisplay = (cc: number | undefined) => {
    if (cc === undefined) return 'Off';
    return `CC ${cc}`;
  };

  return (
    <div className={`absolute top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Toggle Handle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 -left-10 w-10 h-10 bg-gray-800 border-y border-l border-gray-700 rounded-l-md flex items-center justify-center text-yellow-500 hover:text-yellow-400 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] focus:outline-none"
        title={isOpen ? "Close Starred List" : "Open Starred List"}
      >
        <span className="text-lg leading-none">★</span>
      </button>

      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center shrink-0">
        <h3 className="text-sm font-bold text-gray-200 uppercase flex items-center gap-2">
           Starred Items
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">✕</button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
          {starredElements.length === 0 ? (
            <p className="text-xs text-gray-500 italic text-center mt-4">No starred items</p>
          ) : (
            <ul className="space-y-2">
              {starredElements.map((item, i) => {
                if (item.type === 'parameter') {
                  const mod = patch.modules.find(m => m.index === item.moduleIndex);
                  if (!mod) return null;
                  const def = getModuleDefinition(mod.typeId);
                  const blocks = def?.calcBlocks({blocks: def.blocks, options: mod.options}) || [];
                  const blockName = blocks[item.blockIndex]?.name || `Block ${item.blockIndex}`;
                  
                  return (
                    <li key={i} className="text-xs bg-gray-900 p-2 rounded border border-gray-700 hover:border-gray-600 transition-colors">
                      <div className="flex justify-between mb-1">
                        <span 
                          className="font-bold text-white cursor-pointer hover:text-violet-400 truncate"
                          onClick={() => handleNavigate(item.moduleIndex)}
                          title={`Go to ${mod.name || def?.name}`}
                        >
                          {mod.name || def?.name}
                        </span>
                        <span className="text-yellow-500 font-mono">{getCcDisplay(item.midiCc)}</span>
                      </div>
                      <div className="text-gray-400 truncate">{blockName}</div>
                    </li>
                  );
                } else if (item.type === 'connection') {
                  const conn = patch.connections[item.connectionIndex];
                  if (!conn) return null;
                  
                  const srcMod = patch.modules.find(m => m.index === conn.sourceModuleIndex);
                  const destMod = patch.modules.find(m => m.index === conn.destModuleIndex);
                  
                  const srcDef = getModuleDefinition(srcMod?.typeId || -1);
                  const destDef = getModuleDefinition(destMod?.typeId || -1);
      
                  const srcBlocks = srcDef?.calcBlocks({blocks: srcDef.blocks, options: srcMod!.options}) || [];
                  const destBlocks = destDef?.calcBlocks({blocks: destDef.blocks, options: destMod!.options}) || [];
      
                  return (
                    <li key={i} className="text-xs bg-gray-900 p-2 rounded border border-gray-700 hover:border-gray-600 transition-colors">
                       <div className="flex justify-between mb-1">
                          <span className="text-gray-500 font-semibold">Connection</span>
                          <span className="text-yellow-500 font-mono">{getCcDisplay(item.midiCc)}</span>
                       </div>
                       <div className="flex items-center justify-between gap-1 text-gray-400">
                          <span 
                              className="cursor-pointer hover:text-violet-400 truncate max-w-[45%]"
                              onClick={() => handleNavigate(conn.sourceModuleIndex)}
                              title={`Go to ${srcMod?.name}`}
                          >
                              {srcMod?.name || srcDef?.name}
                          </span>
                          <span>→</span>
                          <span 
                              className="cursor-pointer hover:text-violet-400 truncate max-w-[45%] text-right"
                              onClick={() => handleNavigate(conn.destModuleIndex)}
                              title={`Go to ${destMod?.name}`}
                          >
                              {destMod?.name || destDef?.name}
                          </span>
                       </div>
                       <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                          <span>{srcBlocks[conn.sourcePortIndex]?.name}</span>
                          <span>{destBlocks[conn.destPortIndex]?.name}</span>
                       </div>
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          )}
      </div>
    </div>
  );
}
