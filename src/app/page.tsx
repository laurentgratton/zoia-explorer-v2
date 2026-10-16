"use client";

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Sidebar from '@/components/layout/Sidebar';
import { isPatchDirty, usePatchStore } from '@/store/patchStore';
import NodeGraph from '@/components/editor/NodeGraph';
import ModuleCanvas from '@/components/editor/ModuleCanvas';
import PageSelector from '@/components/editor/PageSelector';
import ModuleDetailsModal from '@/components/editor/ModuleDetailsModal';
import NamePromptModal from '@/components/editor/NamePromptModal';
import DisclaimerModal from '@/components/layout/DisclaimerModal';
import { serializePatch } from '@/lib/zoia/serializer';
import PatchPreview from '@/components/preview/PatchPreview';
import { isPreviewFeatureEnabled } from '@/lib/preview/featureFlag';
import FolderWorkspace from '@/components/folders/FolderWorkspace';
import SaveToFolderDialog from '@/components/folders/SaveToFolderDialog';
import FolderDialog, { buttonClass, primaryClass } from '@/components/folders/FolderDialog';
import { getFolder } from '@/services/db';
import { parsePatch } from '@/lib/zoia/parser';

export default function Home() {
  const patch = usePatchStore((state) => state.patch);
  const renamePatch = usePatchStore((state) => state.renamePatch);
  const setSelectedModuleIndex = usePatchStore((state) => state.setSelectedModuleIndex);
  const [isRenamingPatch, setIsRenamingPatch] = React.useState(false);
  const [showDisclaimer, setShowDisclaimer] = React.useState(false);
  const [previewEnabled, setPreviewEnabled] = React.useState(false);
  const [workspace, setWorkspace] = React.useState<'patch' | 'preview'>('patch');
  const [editorView, setEditorView] = React.useState<'grid' | 'modules'>('grid');
  const [area, setArea] = React.useState<'editor' | 'folders'>('editor');
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [folderRefresh, setFolderRefresh] = React.useState(0);
  const [pendingError, setPendingError] = React.useState('');
  const afterSave = React.useRef<(() => void) | undefined>(undefined);
  const dirty = usePatchStore(isPatchDirty);
  const pending = usePatchStore(state => state.pendingPatch);
  const source = usePatchStore(state => state.source);

  const requestSave = (after?: () => void) => {
    afterSave.current = after;
    setSaveOpen(true);
  };
  const acceptPending = async () => {
    const next = usePatchStore.getState().pendingPatch;
    if (!next) return;
    setPendingError('');
    try {
      // Saving may move or update the requested entry. Reload its stable ID, not its old bytes.
      if (next.source) {
        const folder = await getFolder(next.source.folderId);
        const entry = folder.slots.find(item => item?.id === next.source?.entryId);
        if (!entry) throw new Error('The requested patch was removed. Cancel and choose a patch again.');
        if (usePatchStore.getState().pendingPatch !== next) return;
        usePatchStore.getState().setPatch(parsePatch(entry.data), { ...next.source, loadedRevision: folder.revision }, entry.data);
      } else {
        usePatchStore.getState().setPatch(next.patch, null, next.data);
      }
      setArea('editor');
    } catch (cause) { setPendingError(cause instanceof Error ? cause.message : 'Could not open the requested patch.'); }
  };
  React.useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

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
    <div className="flex h-dvh flex-col bg-gray-900">
      <nav aria-label="Workspace" className="flex shrink-0 items-center gap-2 border-b border-gray-700 bg-gray-950 px-4 py-2 text-gray-200">
        <span className="mr-3 font-bold tracking-wide">ZOIA</span>
        <button className={area === 'editor' ? primaryClass : buttonClass} aria-pressed={area === 'editor'} onClick={() => setArea('editor')}>Editor</button>
        <button className={area === 'folders' ? primaryClass : buttonClass} aria-pressed={area === 'folders'} onClick={() => { setArea('folders'); usePatchStore.getState().setSelectedModuleIndex(null); }}>Folders</button>
        {patch && <span className="ml-auto text-xs text-gray-400" role="status">{dirty ? 'Unsaved changes' : source ? 'Saved in browser' : 'Imported copy'}</span>}
      </nav>
      <div className="min-h-0 flex-1">
    <MainLayout
      sidebar={area === 'editor' ? <Sidebar /> : null}
    >
      <div className="w-full h-full flex flex-col bg-gray-900 text-gray-500">
        <DisclaimerModal 
          isOpen={showDisclaimer} 
          onClose={handleAcceptDisclaimer} 
        />
        {(workspace !== 'patch' || editorView === 'grid') && <ModuleDetailsModal />}
        {isRenamingPatch && <NamePromptModal
          isOpen={isRenamingPatch}
          title="Rename Patch"
          initialValue={patch?.name.replace(/\0/g, '') || ''}
          onConfirm={(newName) => {
            renamePatch(newName);
            setIsRenamingPatch(false);
          }}
          onCancel={() => setIsRenamingPatch(false)}
        />}
        {saveOpen && <SaveToFolderDialog onClose={() => { setSaveOpen(false); afterSave.current = undefined; }} onSaved={() => {
          setSaveOpen(false); setFolderRefresh(value => value + 1);
          const after = afterSave.current; afterSave.current = undefined; after?.();
        }} />}
        {pending && !saveOpen && <FolderDialog title="Keep your unsaved changes?" onClose={() => usePatchStore.getState().cancelPendingPatch()}>
          <p className="mb-5 text-sm">Save “{patch?.name || 'Untitled'}” to a folder before opening another patch?</p>
          {pendingError && <p role="alert" className="mb-4 text-sm text-red-300">{pendingError}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button className={buttonClass} onClick={() => usePatchStore.getState().cancelPendingPatch()}>Cancel</button>
            <button className={buttonClass} onClick={acceptPending}>Discard changes</button>
            <button className={primaryClass} onClick={() => requestSave(acceptPending)}>Save to folder…</button>
          </div>
        </FolderDialog>}
        {area === 'folders' ? <FolderWorkspace refreshKey={folderRefresh} onEdit={() => setArea('editor')} onRequestSave={requestSave} /> : patch ? (
           <div className="min-h-0 flex-1 flex flex-col">
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
                 <div className="flex shrink-0 gap-2">
                 <button onClick={() => requestSave()} className={buttonClass}>Save to folder…</button>
                 <button 
                   onClick={handleDownload}
                   className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded text-sm font-medium transition-colors whitespace-nowrap"
                 >
                   Download .bin
                 </button>
                 </div>
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
      </div>
    </div>
  );
}
