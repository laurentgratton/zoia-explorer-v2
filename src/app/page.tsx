"use client";

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Sidebar from '@/components/layout/Sidebar';
import { usePatchStore } from '@/store/patchStore';
import NodeGraph from '@/components/editor/NodeGraph';
import PageSelector from '@/components/editor/PageSelector';
import ModuleDetailsModal from '@/components/editor/ModuleDetailsModal';
import { serializePatch } from '@/lib/zoia/serializer';

export default function Home() {
  const patch = usePatchStore((state) => state.patch);

  const handleDownload = () => {
    if (!patch) return;
    try {
      const buffer = serializePatch(patch);
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = patch.name ? patch.name.replace(/\0/g, '').trim() : 'patch';
      a.download = `${filename}.bin`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to serialize", err);
      alert("Failed to save patch.");
    }
  };

  return (
    <MainLayout
      sidebar={
        <Sidebar />
      }
    >
      <div className="w-full h-full flex flex-col bg-gray-900 text-gray-500">
        <ModuleDetailsModal />
        {patch ? (
           <div className="flex-1 flex flex-col">
              <div className="h-12 border-b border-gray-700 flex items-center px-4 justify-between bg-gray-800 gap-4">
                 <div className="flex items-center gap-4 overflow-hidden">
                    <h2 className="text-white font-bold whitespace-nowrap">{patch.name.replace(/\0/g, '')}</h2>
                    <div className="h-6 w-px bg-gray-600"></div>
                    <PageSelector />
                 </div>
                 <button 
                   onClick={handleDownload}
                   className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded text-sm font-medium transition-colors whitespace-nowrap"
                 >
                   Download .bin
                 </button>
              </div>
              <div className="flex-1 relative">
                 <NodeGraph />
              </div>
           </div>
        ) : (
           <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
               <h1 className="text-2xl text-white mb-2">Zoia Patch Editor</h1>
               <p>Select a patch from the library or upload a file to begin.</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
