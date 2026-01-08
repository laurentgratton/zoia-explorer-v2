import React, { useState } from 'react';
import { usePatchStore } from '@/store/patchStore';
import NamePromptModal from './NamePromptModal';

export default function PageSelector() {
  const patch = usePatchStore((state) => state.patch);
  const activePage = usePatchStore((state) => state.activePage);
  const setActivePage = usePatchStore((state) => state.setActivePage);
  const renamePage = usePatchStore((state) => state.renamePage);
  const addPage = usePatchStore((state) => state.addPage);

  const [renamingPageIndex, setRenamingPageIndex] = useState<number | null>(null);
  const [isAddingPage, setIsAddingPage] = useState(false);

  if (!patch) return null;

  // Calculate total pages based on modules and explicit page names
  // We need to find the max page index used.
  const maxModulePage = patch.modules.reduce((max, m) => Math.max(max, m.page), 0);
  // Ensure we have at least one page (0)
  const numPages = Math.max(maxModulePage + 1, (patch.pageNames?.length || 0));
  
  const pages = Array.from({ length: numPages }, (_, i) => i);

  return (
    <div className="flex items-center space-x-1 bg-gray-800/50 rounded p-1">
       <NamePromptModal
         isOpen={renamingPageIndex !== null}
         title={`Rename Page ${renamingPageIndex}`}
         initialValue={renamingPageIndex !== null ? (patch.pageNames?.[renamingPageIndex]?.replace(/\0/g, '').trim() || '') : ''}
         onConfirm={(newName) => {
           if (renamingPageIndex !== null) {
             renamePage(renamingPageIndex, newName);
           }
           setRenamingPageIndex(null);
         }}
         onCancel={() => setRenamingPageIndex(null)}
       />
       <NamePromptModal
         isOpen={isAddingPage}
         title="Add New Page"
         initialValue={`Page ${numPages}`}
         confirmLabel="Add Page"
         onConfirm={(newName) => {
           addPage(newName);
           setIsAddingPage(false);
         }}
         onCancel={() => setIsAddingPage(false)}
       />
       <div className="flex items-center overflow-x-auto max-w-lg space-x-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
         {pages.map((pageIndex) => {
            const rawName = patch.pageNames?.[pageIndex];
            const pageName = rawName ? rawName.replace(/\0/g, '').trim() : '';
            const displayName = pageName || `${pageIndex}`;

            return (
              <button
                key={pageIndex}
                onClick={() => setActivePage(pageIndex)}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  setRenamingPageIndex(pageIndex);
                }}
                className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  activePage === pageIndex 
                    ? 'bg-violet-600 text-white font-bold shadow-sm' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
                title={`Go to Page ${pageIndex} (Double click to rename)`}
              >
                {displayName}
              </button>
            );
         })}
       </div>
       <button
         onClick={() => setIsAddingPage(true)}
         disabled={numPages >= 62}
         className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
         title={numPages >= 62 ? "Maximum 62 pages reached" : "Add new page"}
       >
         +
       </button>
    </div>
  );
}
