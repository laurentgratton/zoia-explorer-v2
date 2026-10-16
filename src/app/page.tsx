"use client";

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Sidebar from '@/components/layout/Sidebar';
import { usePatchStore } from '@/store/patchStore';
import NodeGraph from '@/components/editor/NodeGraph';
import ModuleCanvas from '@/components/editor/ModuleCanvas';
import PageSelector from '@/components/editor/PageSelector';
import ModuleDetailsModal from '@/components/editor/ModuleDetailsModal';
import NamePromptModal from '@/components/editor/NamePromptModal';
import DisclaimerModal from '@/components/layout/DisclaimerModal';
import { serializePatch } from '@/lib/zoia/serializer';
import PatchPreview from '@/components/preview/PatchPreview';
import { isPreviewFeatureEnabled } from '@/lib/preview/featureFlag';

export default function Home() {
  const patch = usePatchStore((state) => state.patch);
  const renamePatch = usePatchStore((state) => state.renamePatch);
  const setSelectedModuleIndex = usePatchStore((state) => state.setSelectedModuleIndex);
  const [isRenamingPatch, setIsRenamingPatch] = React.useState(false);
  const [showDisclaimer, setShowDisclaimer] = React.useState(false);
  const [previewEnabled, setPreviewEnabled] = React.useState(false);
  const [workspace, setWorkspace] = React.useState<'patch' | 'preview'>('patch');
  const [editorView, setEditorView] = React.useState<'grid' | 'modules'>('grid');

  React.useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem('zoia-disclaimer-seen');
    if (!hasSeenDisclaimer) {
      setShowDisclaimer(true);
    }
    setPreviewEnabled(isPreviewFeatureEnabled(window.location.search));
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('zoia-disclaimer-seen', 'true');
    setShowDisclaimer(false);
  };

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
        <DisclaimerModal 
          isOpen={showDisclaimer} 
          onClose={handleAcceptDisclaimer} 
        />
        {(workspace !== 'patch' || editorView === 'grid') && <ModuleDetailsModal />}
        <NamePromptModal
          isOpen={isRenamingPatch}
          title="Rename Patch"
          initialValue={patch?.name.replace(/\0/g, '') || ''}
          onConfirm={(newName) => {
            renamePatch(newName);
            setIsRenamingPatch(false);
          }}
          onCancel={() => setIsRenamingPatch(false)}
        />
        {patch ? (
           <div className="flex-1 min-h-0 flex flex-col">
              <div className="h-12 border-b border-gray-700 flex items-center px-4 justify-between bg-gray-800 gap-4">
                 <div className="flex items-center gap-4 overflow-hidden">
                    <h2 
                      className="text-white pl-7 font-bold whitespace-nowrap cursor-pointer hover:text-violet-400 transition-colors"
                      onClick={() => setIsRenamingPatch(true)}
                      title="Click to rename patch"
                    >
                      {patch.name.replace(/\0/g, '') || 'Untitled Patch'}
                    </h2>
                    <div className="h-6 w-px bg-gray-600"></div>
                    {previewEnabled && (
                      <div className="flex items-center h-full gap-1" aria-label="Patch workspace">
                        <button
                          type="button"
                          onClick={() => setWorkspace('patch')}
                          className={`h-12 px-3 text-sm border-b-2 transition-colors ${workspace === 'patch' ? 'border-violet-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                        >
                          Patch
                        </button>
                        <button
                          type="button"
                          onClick={() => setWorkspace('preview')}
                          className={`h-12 px-3 text-sm border-b-2 transition-colors ${workspace === 'preview' ? 'border-violet-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                        >
                          Preview
                        </button>
                      </div>
                    )}
                    {workspace === 'patch' && (
                      <>
                        {previewEnabled && <div className="h-6 w-px bg-gray-600"></div>}
                        <div role="group" aria-label="Editor view" className="flex shrink-0 rounded border border-gray-600 p-0.5">
                          {(['grid', 'modules'] as const).map(view => (
                            <button
                              key={view}
                              type="button"
                              aria-pressed={editorView === view}
                              onClick={() => {
                                setSelectedModuleIndex(null);
                                setEditorView(view);
                              }}
                              className={`px-3 py-1 rounded text-sm focus-visible:outline-2 focus-visible:outline-white ${editorView === view ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                            >
                              {view === 'grid' ? 'Grid' : 'Modules'}
                            </button>
                          ))}
                        </div>
                        {editorView === 'grid' && <PageSelector />}
                      </>
                    )}
                 </div>
                 <button 
                   onClick={handleDownload}
                   className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded text-sm font-medium transition-colors whitespace-nowrap"
                 >
                   Download .bin
                 </button>
              </div>
              <div className="flex-1 min-h-0 relative">
                 {workspace === 'preview' && previewEnabled ? <PatchPreview /> : editorView === 'grid' ? <NodeGraph /> : <ModuleCanvas />}
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
