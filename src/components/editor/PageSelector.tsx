import React from 'react';
import { usePatchStore } from '@/store/patchStore';

export default function PageSelector() {
  const patch = usePatchStore((state) => state.patch);
  const activePage = usePatchStore((state) => state.activePage);
  const setActivePage = usePatchStore((state) => state.setActivePage);

  if (!patch) return null;

  // Calculate total pages based on modules and explicit page names
  // We need to find the max page index used.
  const maxModulePage = patch.modules.reduce((max, m) => Math.max(max, m.page), 0);
  // Ensure we have at least one page (0)
  const numPages = Math.max(maxModulePage + 1, (patch.pageNames?.length || 0));
  
  const pages = Array.from({ length: numPages }, (_, i) => i);

  return (
    <div className="flex items-center overflow-x-auto max-w-lg space-x-1 bg-gray-800/50 rounded p-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
       {pages.map((pageIndex) => {
          const rawName = patch.pageNames?.[pageIndex];
          const pageName = rawName ? rawName.replace(/\0/g, '').trim() : '';
          const displayName = pageName || `${pageIndex}`;

          return (
            <button
              key={pageIndex}
              onClick={() => setActivePage(pageIndex)}
              className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                activePage === pageIndex 
                  ? 'bg-violet-600 text-white font-bold shadow-sm' 
                  : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
              title={`Go to Page ${pageIndex}`}
            >
              {displayName}
            </button>
          );
       })}
    </div>
  );
}
