import React, { useEffect, useState, useCallback } from 'react';
import { getAllPatches, deletePatch, StoredPatch } from '@/services/db';
import { parsePatch } from '@/lib/zoia/parser';
import { usePatchStore } from '@/store/patchStore';
import PatchUploader from './PatchUploader';

export default function PatchLibrary() {
  const [patches, setPatches] = useState<StoredPatch[]>([]);
  const [loading, setLoading] = useState(true);
  const setPatch = usePatchStore((state) => state.setPatch);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const activePatch = usePatchStore((state) => state.patch); 

  const loadPatches = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await getAllPatches();
      // Sort by date descending (newest first)
      stored.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setPatches(stored);
    } catch (err) {
      console.error("Failed to load patches", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatches();
  }, [loadPatches]);

  const handleLoad = (stored: StoredPatch) => {
    try {
      const patch = parsePatch(stored.data);
      setPatch(patch);
    } catch (err) {
      console.error("Failed to parse stored patch", err);
      alert("Failed to load patch. It might be corrupted.");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this patch?')) {
      await deletePatch(id);
      loadPatches();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <PatchUploader onUploadSuccess={loadPatches} />
      
      <div className="flex-1 overflow-y-auto min-h-0 py-2">
        <h3 className="text-xs font-bold mb-2 px-4 text-gray-500 uppercase tracking-wider">Library</h3>
        {loading ? (
          <div className="px-4 text-gray-500 text-sm">Loading...</div>
        ) : patches.length === 0 ? (
          <div className="px-4 text-gray-500 text-sm italic">No patches found.</div>
        ) : (
          <ul className="space-y-0.5">
            {patches.map((p) => (
              <li 
                key={p.id} 
                className="px-4 py-3 hover:bg-gray-800 cursor-pointer flex justify-between items-center group border-b border-gray-800 last:border-0"
                onClick={() => handleLoad(p)}
              >
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-sm text-gray-200 font-medium" title={p.name}>{p.name}</span>
                  <span className="text-xs text-gray-600">{p.createdAt.toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={(e) => handleDelete(p.id, e)}
                  className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded hover:bg-gray-700"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
