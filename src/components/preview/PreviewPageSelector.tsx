import React from 'react';
import type { Patch } from '@/lib/zoia/types';
import { usePatchStore } from '@/store/patchStore';
import { getPreviewPageCount, getPreviewPageName } from '@/lib/preview/previewModel';

export default function PreviewPageSelector({ patch }: { patch: Patch }) {
  const activePage = usePatchStore((state) => state.activePage);
  const setActivePage = usePatchStore((state) => state.setActivePage);
  const pageCount = getPreviewPageCount(patch);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {Array.from({ length: pageCount }, (_, pageIndex) => (
        <button
          key={pageIndex}
          type="button"
          onClick={() => setActivePage(pageIndex)}
          className={`px-4 py-2 text-sm rounded border whitespace-nowrap transition-colors ${
            activePage === pageIndex
              ? 'bg-violet-600/30 border-violet-500 text-white'
              : 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
          }`}
        >
          {pageIndex + 1} · {getPreviewPageName(patch, pageIndex)}
        </button>
      ))}
    </div>
  );
}
