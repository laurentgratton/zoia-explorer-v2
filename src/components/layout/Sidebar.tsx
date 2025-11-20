import React, { useState } from 'react';
import PatchLibrary from '../library/PatchLibrary';
import ModulePalette from '../editor/ModulePalette';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<'library' | 'modules'>('library');

  return (
    <div className="flex flex-col h-full w-full bg-gray-900">
       <div className="flex border-b border-gray-700">
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'library' ? 'text-white border-b-2 border-violet-500 bg-gray-800' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
            onClick={() => setActiveTab('library')}
          >
            Library
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'modules' ? 'text-white border-b-2 border-violet-500 bg-gray-800' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
            onClick={() => setActiveTab('modules')}
          >
            Modules
          </button>
       </div>
       <div className="flex-1 overflow-hidden relative">
          {activeTab === 'library' ? <PatchLibrary /> : <ModulePalette />}
       </div>
    </div>
  );
}
