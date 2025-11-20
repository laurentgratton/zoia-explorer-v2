import React, { useMemo, useState } from 'react';
import { MODULE_DEFINITIONS, ModuleDefinition } from '@/lib/zoia/moduleLib';
import { usePatchStore } from '@/store/patchStore';

export default function ModulePalette() {
  const addModule = usePatchStore((state) => state.addModule);
  const [search, setSearch] = useState('');

  // Group by category
  const groupedModules = useMemo(() => {
    const groups: Record<string, ModuleDefinition[]> = {};
    Object.values(MODULE_DEFINITIONS).forEach(def => {
      if (search && !def.name.toLowerCase().includes(search.toLowerCase())) return;
      
      if (!groups[def.category]) groups[def.category] = [];
      groups[def.category].push(def);
    });
    return groups;
  }, [search]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-full">
       <div className="p-4 border-b border-gray-700">
         <input 
           type="text" 
           placeholder="Search modules..." 
           className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-violet-500"
           value={search}
           onChange={(e) => setSearch(e.target.value)}
         />
       </div>
       <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-700">
         {Object.entries(groupedModules).sort((a, b) => a[0].localeCompare(b[0])).map(([category, modules]) => (
           <div key={category} className="mb-4">
             <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 px-2 sticky top-0 bg-gray-900 py-1">{category}</h4>
             <div className="space-y-0.5">
               {modules.sort((a,b) => a.name.localeCompare(b.name)).map(mod => (
                 <button
                   key={mod.typeId}
                   onClick={() => addModule(mod.typeId)}
                   className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded text-sm flex justify-between group transition-colors items-center"
                 >
                   <span className="text-gray-300 group-hover:text-white">{mod.name}</span>
                   <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">+</span>
                 </button>
               ))}
             </div>
           </div>
         ))}
       </div>
    </div>
  );
}
