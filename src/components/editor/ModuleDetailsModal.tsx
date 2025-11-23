import React, { useState } from 'react';
import { usePatchStore } from '@/store/patchStore';
import { getModuleDefinition } from '@/lib/zoia/moduleLib';
import ConnectionPickerModal from './ConnectionPickerModal';
import { Connection } from '@/lib/zoia/types';

export default function ModuleDetailsModal() {
  const [showDebug, setShowDebug] = useState(false);
  const [pickerState, setPickerState] = useState<{show: boolean, direction: 'input' | 'output'}>({show: false, direction: 'input'});
  
  const { 
    patch, 
    selectedModuleIndex, 
    setSelectedModuleIndex, 
    updateModuleName, 
    updateModuleParams, 
    removeModule,
    addConnection,
    removeConnection,
    updateConnectionStrength,
    toggleStarParameter,
    toggleStarConnection,
    setStarredParameterCc,
    setStarredConnectionCc,
    setActivePage
  } = usePatchStore();

  if (!patch || selectedModuleIndex === null) return null;

  const moduleData = patch.modules.find(m => m.index === selectedModuleIndex);
  if (!moduleData) return null;

  const definition = getModuleDefinition(moduleData!.typeId);

  // Connections with original indices
  const connectionsWithIndex = patch.connections.map((c, i) => ({ ...c, originalIndex: i }));
  const incoming = connectionsWithIndex.filter(c => c.destModuleIndex === moduleData!.index);
  const outgoing = connectionsWithIndex.filter(c => c.sourceModuleIndex === moduleData!.index);

  const handleClose = () => setSelectedModuleIndex(null);

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this module?')) {
      removeModule(moduleData!.index);
    }
  };

  // Helpers for Star/CC
  const isStarredParam = (blockIndex: number) => 
    patch.starredElements?.some(s => s.type === 'parameter' && s.moduleIndex === moduleData.index && s.blockIndex === blockIndex);
  
  const getStarredParamCc = (blockIndex: number) => {
    const el = patch.starredElements?.find(s => s.type === 'parameter' && s.moduleIndex === moduleData.index && s.blockIndex === blockIndex);
    return el?.midiCc;
  };

  const isStarredConn = (connIndex: number) => 
    patch.starredElements?.some(s => s.type === 'connection' && s.connectionIndex === connIndex);
  
  const getStarredConnCc = (connIndex: number) => {
     const el = patch.starredElements?.find(s => s.type === 'connection' && s.connectionIndex === connIndex);
     return el?.midiCc;
  };

  // CC Display Value Logic: Input 1 -> CC 0. Input 0 -> Disabled.
  // If stored value is undefined, display 0.
  // If stored value is 0, display 1.
  // If stored value is 127, display 128.
  const getCcDisplayValue = (storedCc: number | undefined) => {
    if (storedCc === undefined) return 0;
    return storedCc + 1;
  };

  const handleCcChange = (valStr: string, callback: (val: number | undefined) => void) => {
     const val = parseInt(valStr, 10);
     if (isNaN(val)) return;
     if (val <= 0) callback(undefined);
     else if (val > 128) callback(127);
     else callback(val - 1);
  };

  const handleNavigate = (targetModuleIndex: number) => {
    const targetMod = patch.modules.find(m => m.index === targetModuleIndex);
    if (targetMod) {
      setActivePage(targetMod.page);
      setSelectedModuleIndex(targetModuleIndex);
    }
  };

  const blocks = definition?.calcBlocks({blocks: definition.blocks, options: moduleData.options}) || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-xl w-[600px] max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-xl font-bold text-white">{moduleData!.name || definition?.name || 'Unknown Module'}</h2>
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
           <div className="flex justify-between"><span>Type:</span> <span className="text-white">{definition?.name || moduleData!.typeId}</span></div>
           <div className="flex justify-between"><span>Category:</span> <span className="text-white">{definition?.category || 'N/A'}</span></div>
           <div className="flex justify-between"><span>ID:</span> <span className="text-white">{moduleData!.index}</span></div>
           <div className="flex justify-between"><span>Page:</span> <span className="text-white">{moduleData!.page}</span></div>
           <div className="flex justify-between"><span>Grid Position:</span> <span className="text-white">{moduleData!.gridPosition}</span></div>
        </div>

        {/* Rename */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
          <input 
            type="text" 
            value={moduleData!.name}
            onChange={(e) => updateModuleName(moduleData!.index, e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
          />
        </div>

        {/* Options */}
        <div className="mb-6">
           <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Options</h3>
           {moduleData!.options.length === 0 ? (
             <p className="text-xs text-gray-500 italic">No options</p>
           ) : (
             <div className="space-y-2">
               {definition?.options.map((paramValue, i) => {
                 const optionDef = definition?.options && i < definition.options.length ? definition.options[i] : null;
                 return (
                   <div key={i} className="flex items-center gap-2 justify-between">
                      {optionDef ? (
                        <>
                          <label className="text-xs text-gray-400 flex-1">{optionDef.name}</label>
                          <select
                            value={moduleData.options[i]}
                            onChange={(e) => {
                               const val = parseInt(e.target.value, 10);
                               if (!isNaN(val)) {
                                 const newParams = [...moduleData!.options];
                                 newParams[i] = val;
                                 updateModuleParams(moduleData!.index, newParams);
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
                         <span className="text-xs text-gray-500">Unknown Option {i}</span>
                      )}
                   </div>
                 );
               })}
             </div>
           )}
        </div>

        {/* Blocks */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Blocks</h3>
          <div className="space-y-1">
          {blocks.map((block, i) => {
              const starred = isStarredParam(i);
              const ccVal = getStarredParamCc(i);
              return (
              <div key={i} className="flex items-center gap-2 justify-between bg-gray-900/50 p-1 rounded">
                <div className="text-sm text-white">{block.name}</div>
                <div className="flex items-center gap-2">
                    {starred && (
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-500 uppercase">CC</span>
                            <input 
                                type="number" 
                                min="0" 
                                max="128"
                                className="w-12 bg-gray-800 border border-gray-700 rounded px-1 text-xs text-right"
                                value={getCcDisplayValue(ccVal)}
                                onChange={(e) => handleCcChange(e.target.value, (val) => setStarredParameterCc(moduleData.index, i, val))}
                            />
                        </div>
                    )}
                    <button 
                        onClick={() => toggleStarParameter(moduleData.index, i)}
                        className={`text-lg leading-none ${starred ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                        ★
                    </button>
                </div>
              </div>
          )})}
          </div>
        </div>

        {/* Connections */}
        <div className="mb-6">
           <div className="flex items-center justify-between mb-2">
               <h3 className="text-sm font-bold text-gray-400 uppercase">Connections</h3>
           </div>
           
           {/* Inputs */}
           <div className="mb-4">
             <div className="flex justify-between items-center mb-1">
                 <span className="text-xs text-violet-400 font-semibold">Inputs ({incoming.length})</span>
                 <button 
                    onClick={() => setPickerState({show: true, direction: 'input'})}
                    className="text-xs bg-violet-900/30 hover:bg-violet-600 text-violet-300 hover:text-white px-2 py-0.5 rounded border border-violet-800 transition-colors"
                 >
                     + Add
                 </button>
             </div>
             <ul className="mt-1 space-y-1">
               {incoming.length === 0 && <li className="text-xs text-gray-600 italic">None</li>}
               {incoming.map((c, i) => {
                  const srcMod = patch.modules.find(m => m.index === c.sourceModuleIndex);
                  const srcName = srcMod?.name || getModuleDefinition(srcMod?.typeId || -1)?.name || `Mod ${c.sourceModuleIndex}`;
                  const starred = isStarredConn(c.originalIndex);
                  const ccVal = getStarredConnCc(c.originalIndex);
                  
                  return (
                    <li key={i} className="text-xs bg-gray-900 p-2 rounded border border-gray-700 flex items-center justify-between gap-2">
                      <div className="flex-1 flex flex-wrap items-center gap-1">
                          <span 
                              className="text-gray-300 hover:text-white hover:underline cursor-pointer"
                              onClick={() => handleNavigate(c.sourceModuleIndex)}
                          >
                              {srcName}
                          </span>
                          <span className="text-gray-500"> : {blocks[c.destPortIndex]?.name || `Block ${c.destPortIndex}`}</span>
                          <span className="text-gray-600 mx-1">←</span>
                          <span className="text-gray-500">Src Block {c.sourcePortIndex + 1}</span>
                          <div className="flex items-center gap-1 ml-2 bg-gray-800 px-1 rounded border border-gray-800 hover:border-gray-600 transition-colors">
                              <input 
                                  type="range" 
                                  min="0" 
                                  max="10000"
                                  value={c.strength} 
                                  onChange={(e) => updateConnectionStrength(c.originalIndex, parseInt(e.target.value))}
                                  className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                  title={`Strength: ${c.strength}`}
                              />
                              <span className="text-gray-500 text-[10px] font-mono min-w-[30px] text-right">{c.strength}</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          {starred && (
                            <input 
                                type="number" 
                                min="0" 
                                max="128"
                                className="w-10 bg-gray-800 border border-gray-700 rounded px-1 text-xs text-right"
                                value={getCcDisplayValue(ccVal)}
                                onChange={(e) => handleCcChange(e.target.value, (val) => setStarredConnectionCc(c.originalIndex, val))}
                            />
                          )}
                          <button 
                            onClick={() => toggleStarConnection(c.originalIndex)}
                            className={`text-base leading-none ${starred ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'}`}
                          >
                            ★
                          </button>
                          <button 
                            onClick={() => {
                                if(confirm('Remove connection?')) {
                                    removeConnection(c.sourceModuleIndex, c.sourcePortIndex, c.destModuleIndex, c.destPortIndex);
                                }
                            }}
                            className="text-red-500 hover:text-red-300 font-bold px-1"
                          >
                            ✕
                          </button>
                      </div>
                    </li>
                  );
               })}
             </ul>
           </div>

           {/* Outputs */}
           <div>
             <div className="flex justify-between items-center mb-1">
                 <span className="text-xs text-green-400 font-semibold">Outputs ({outgoing.length})</span>
                 <button 
                    onClick={() => setPickerState({show: true, direction: 'output'})}
                    className="text-xs bg-green-900/30 hover:bg-green-600 text-green-300 hover:text-white px-2 py-0.5 rounded border border-green-800 transition-colors"
                 >
                     + Add
                 </button>
             </div>
             <ul className="mt-1 space-y-1">
               {outgoing.length === 0 && <li className="text-xs text-gray-600 italic">None</li>}
               {outgoing.map((c, i) => {
                  const destMod = patch.modules.find(m => m.index === c.destModuleIndex);
                  const destName = destMod?.name || getModuleDefinition(destMod?.typeId || -1)?.name || `Mod ${c.destModuleIndex}`;
                  const starred = isStarredConn(c.originalIndex);
                  const ccVal = getStarredConnCc(c.originalIndex);

                  return (
                    <li key={i} className="text-xs bg-gray-900 p-2 rounded border border-gray-700 flex items-center justify-between gap-2">
                      <div className="flex-1 flex flex-wrap items-center gap-1">
                          <span className="text-gray-500">{blocks[c.sourcePortIndex]?.name || `Block ${c.sourcePortIndex}`}</span>
                          <span className="text-gray-600 mx-1">→</span>
                          <span 
                              className="text-gray-300 hover:text-white hover:underline cursor-pointer"
                              onClick={() => handleNavigate(c.destModuleIndex)}
                          >
                              {destName}
                          </span>
                          <span className="text-gray-500"> : Dest Block {c.destPortIndex + 1}</span>
                          <div className="flex items-center gap-1 ml-2 bg-gray-800 px-1 rounded border border-gray-800 hover:border-gray-600 transition-colors">
                              <input 
                                  type="range" 
                                  min="0" 
                                  max="10000"
                                  value={c.strength} 
                                  onChange={(e) => updateConnectionStrength(c.originalIndex, parseInt(e.target.value))}
                                  className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
                                  title={`Strength: ${c.strength}`}
                              />
                              <span className="text-gray-500 text-[10px] font-mono min-w-[30px] text-right">{c.strength}</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          {starred && (
                            <input 
                                type="number" 
                                min="0" 
                                max="128"
                                className="w-10 bg-gray-800 border border-gray-700 rounded px-1 text-xs text-right"
                                value={getCcDisplayValue(ccVal)}
                                onChange={(e) => handleCcChange(e.target.value, (val) => setStarredConnectionCc(c.originalIndex, val))}
                            />
                          )}
                          <button 
                            onClick={() => toggleStarConnection(c.originalIndex)}
                            className={`text-base leading-none ${starred ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'}`}
                          >
                            ★
                          </button>
                          <button 
                            onClick={() => {
                                if(confirm('Remove connection?')) {
                                    removeConnection(c.sourceModuleIndex, c.sourcePortIndex, c.destModuleIndex, c.destPortIndex);
                                }
                            }}
                            className="text-red-500 hover:text-red-300 font-bold px-1"
                          >
                            ✕
                          </button>
                      </div>
                    </li>
                  );
               })}
             </ul>
           </div>
        </div>
        <div className="mb-6">
          <span className="text-xs text-red-500 font-semibold">Debug <button onClick={() => setShowDebug(!showDebug)}>{showDebug ? "Hide" : "Show"}</button></span>
          {showDebug && (
              <div className="mb-2">
                <p>{JSON.stringify(moduleData)}</p>
              </div>
          )}
        </div>

        {pickerState.show && (
            <ConnectionPickerModal 
                sourceModule={moduleData}
                direction={pickerState.direction}
                onClose={() => setPickerState({...pickerState, show: false})}
                onSelect={(conn) => {
                    addConnection(conn);
                    setPickerState({...pickerState, show: false});
                }}
            />
        )}
      </div>
    </div>
  );
}
