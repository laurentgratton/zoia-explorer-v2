import React from 'react';
import { usePatchStore } from '@/store/patchStore';
import { getModuleDefinition } from '@/lib/zoia/moduleLib';

export default function ModuleDetailsModal() {
  const { patch, selectedModuleIndex, setSelectedModuleIndex, updateModuleName, updateModuleParams, removeModule } = usePatchStore();

  if (!patch || selectedModuleIndex === null) return null;

  const module = patch.modules.find(m => m.index === selectedModuleIndex);
  if (!module) return null;

  const definition = getModuleDefinition(module.typeId);

  // Connections
  const incoming = patch.connections.filter(c => c.destModuleIndex === module.index);
  const outgoing = patch.connections.filter(c => c.sourceModuleIndex === module.index);

  const handleClose = () => setSelectedModuleIndex(null);

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this module?')) {
      removeModule(module.index);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-xl w-[500px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-xl font-bold text-white">{module.name || definition?.name || 'Unknown Module'}</h2>
           <div className="flex gap-2 items-center">
             <button 
               onClick={handleDelete}
               className="px-3 py-1 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white text-xs rounded border border-red-800 transition-colors font-medium"
             >
               Delete
             </button>
             <button onClick={handleClose} className="text-gray-400 hover:text-white p-1">✕</button>
           </div>
        </div>

        {/* Info */}
        <div className="mb-6 space-y-2 text-sm text-gray-300">
           <div className="flex justify-between"><span>Type:</span> <span className="text-white">{definition?.name || module.typeId}</span></div>
           <div className="flex justify-between"><span>Category:</span> <span className="text-white">{definition?.category || 'N/A'}</span></div>
           <div className="flex justify-between"><span>ID:</span> <span className="text-white">{module.index}</span></div>
           <div className="flex justify-between"><span>Page:</span> <span className="text-white">{module.page}</span></div>
           <div className="flex justify-between"><span>Grid Position:</span> <span className="text-white">{module.gridPosition}</span></div>
        </div>

        {/* Rename */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
          <input 
            type="text" 
            value={module.name}
            onChange={(e) => updateModuleName(module.index, e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
          />
        </div>

        {/* Parameters */}
        <div className="mb-6">
           <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Parameters</h3>
           {module.parameters.length === 0 ? (
             <p className="text-xs text-gray-500 italic">No parameters</p>
           ) : (
             <div className="space-y-2">
               {module.parameters.map((paramValue, i) => {
                 const optionDef = definition?.options && i < definition.options.length ? definition.options[i] : null;

                 return (
                   <div key={i} className="flex items-center gap-2 justify-between">
                      {optionDef ? (
                        <>
                          <label className="text-xs text-gray-400 flex-1">{optionDef.name}</label>
                          <select
                            value={paramValue}
                            onChange={(e) => {
                               const val = parseInt(e.target.value, 10);
                               if (!isNaN(val)) {
                                 const newParams = [...module.parameters];
                                 newParams[i] = val;
                                 updateModuleParams(module.index, newParams);
                               }
                            }}
                            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white w-1/2"
                          >
                            {optionDef.values.map((optVal, optIndex) => (
                              <option key={optIndex} value={optIndex}>
                                {optVal}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <>
                           <span className="text-xs text-gray-500 w-8">#{i}</span>
                           <input 
                             type="number" 
                             value={paramValue}
                             onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  const newParams = [...module.parameters];
                                  newParams[i] = val;
                                  updateModuleParams(module.index, newParams);
                                }
                             }}
                             className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                           />
                        </>
                      )}
                   </div>
                 );
               })}
             </div>
           )}
        </div>

        {/* Connections */}
        <div className="mb-6">
           <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Connections</h3>
           
           <div className="mb-2">
             <span className="text-xs text-violet-400 font-semibold">Inputs ({incoming.length})</span>
             <ul className="mt-1 space-y-1">
               {incoming.length === 0 && <li className="text-xs text-gray-600 italic">None</li>}
               {incoming.map((c, i) => {
                  const srcMod = patch.modules.find(m => m.index === c.sourceModuleIndex);
                  const srcName = srcMod?.name || getModuleDefinition(srcMod?.typeId || -1)?.name || `Mod ${c.sourceModuleIndex}`;
                  const srcTable = patch.pageNames[srcMod?.page || 0];
                  return (
                    <li key={i} className="text-xs bg-gray-900 p-1 rounded border border-gray-700">
                      <span className="text-gray-400">{srcName}{!!srcTable ? ' | ' + srcTable: ''}</span> (Block {c.sourcePortIndex}) → (Block {c.destPortIndex}) <span className="text-gray-500">@{c.strength}</span>
                    </li>
                  );
               })}
             </ul>
           </div>

           <div>
             <span className="text-xs text-green-400 font-semibold">Outputs ({outgoing.length})</span>
             <ul className="mt-1 space-y-1">
               {outgoing.length === 0 && <li className="text-xs text-gray-600 italic">None</li>}
               {outgoing.map((c, i) => {
                  const destMod = patch.modules.find(m => m.index === c.destModuleIndex);
                  const destName = destMod?.name || getModuleDefinition(destMod?.typeId || -1)?.name || `Mod ${c.destModuleIndex}`;
                  const destTable = patch.pageNames[destMod?.page || 0];
                  return (
                    <li key={i} className="text-xs bg-gray-900 p-1 rounded border border-gray-700">
                      (Block {c.sourcePortIndex}) → <span className="text-gray-400">{destName}{!!destTable ? ' | ' + destTable : ''}</span> (Block {c.destPortIndex}) <span className="text-gray-500">@{c.strength}</span>
                    </li>
                  );
               })}
             </ul>
           </div>
        </div>

      </div>
    </div>
  );
}
