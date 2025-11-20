import React, { useRef, useState } from 'react';
import { parsePatch } from '@/lib/zoia/parser';
import { addPatch } from '@/services/db';

interface PatchUploaderProps {
  onUploadSuccess: () => void;
}

export default function PatchUploader({ onUploadSuccess }: PatchUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Validate by parsing
      try {
        parsePatch(arrayBuffer);
      } catch (err) {
        console.error('Validation error:', err);
        throw new Error('Invalid Zoia patch file: ' + (err instanceof Error ? err.message : String(err)));
      }

      await addPatch(file.name, arrayBuffer);
      onUploadSuccess();
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to upload patch');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 border-b border-gray-700 bg-gray-800">
      <h3 className="text-sm font-bold mb-3 text-gray-300 uppercase tracking-wider">Import Patch</h3>
      <div className="relative">
        <input
          type="file"
          accept=".bin"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-xs text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-xs file:font-semibold
            file:bg-gray-700 file:text-white
            hover:file:bg-gray-600
            cursor-pointer"
        />
      </div>
      {error && <p className="text-red-400 text-xs mt-2 break-words">{error}</p>}
    </div>
  );
}
