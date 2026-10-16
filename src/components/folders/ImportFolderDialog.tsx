import React, { useState } from 'react';
import {
  FolderEntry,
  importFolder,
  readFolderEntry,
  SLOT_COUNT,
  slotLabel,
} from '@/lib/zoia/folders';
import { addFolder } from '@/services/db';
import FolderDialog, { buttonClass, inputClass, primaryClass } from './FolderDialog';

interface ImportRow {
  filename: string;
  entry?: FolderEntry;
  error?: string;
  slot: string;
}

export default function ImportFolderDialog({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (id: string) => void;
}) {
  const [name, setName] = useState('Imported folder');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [ignored, setIgnored] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function readFiles(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    setError('');
    try {
      const next: ImportRow[] = [],
        skipped: string[] = [];
      const folderName = files[0]?.webkitRelativePath.split('/')[0];
      if (folderName) setName(folderName);
      for (const file of Array.from(files)) {
        const path = file.webkitRelativePath || file.name;
        if (path.split('/').length > 2 || !/\.bin$/i.test(file.name)) {
          skipped.push(path);
          continue;
        }
        try {
          if (file.size > 32768) throw new Error('Larger than the supported 32 KiB patch size.');
          const entry = readFolderEntry(await file.arrayBuffer(), file.name);
          const prefix = file.name.match(/^(\d{3})(?!\d)/)?.[1];
          const slot =
            prefix !== undefined && Number(prefix) < SLOT_COUNT ? String(Number(prefix)) : '?';
          next.push({ filename: file.name, entry, slot });
        } catch (cause) {
          next.push({
            filename: file.name,
            error: cause instanceof Error ? cause.message : 'Invalid patch',
            slot: '-',
          });
        }
      }
      setRows(next);
      setIgnored(skipped);
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  }

  const included = rows.filter((row) => row.slot !== '-');
  const assigned = included.map((row) => row.slot);
  const unresolved =
    assigned.includes('?') ||
    new Set(assigned).size !== assigned.length ||
    included.length > SLOT_COUNT;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (unresolved || !included.length)
        throw new Error('Assign a unique slot to every included patch, or exclude it.');
      const folder = importFolder(
        name,
        included.map((row) => ({ slot: Number(row.slot), entry: row.entry! })),
      );
      await addFolder(folder);
      onImported(folder.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Import failed. No folder was saved.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <FolderDialog title="Import patch folder" onClose={onClose} busy={busy} wide>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-400">
          Import a browser copy. Your disk files stay unchanged. Only immediate .bin files are
          included; review exclusions below.
        </p>
        <div className="flex flex-wrap gap-3">
          <label className={buttonClass}>
            Choose folder
            <input
              aria-label="Choose folder"
              type="file"
              className="mt-2 block max-w-full text-xs"
              disabled={busy}
              ref={(element) => {
                element?.setAttribute('webkitdirectory', '');
              }}
              onChange={(event) => void readFiles(event.target.files)}
            />
          </label>
          <label className={buttonClass}>
            Or choose .bin files
            <input
              aria-label="Choose patch files"
              type="file"
              accept=".bin"
              multiple
              className="mt-2 block max-w-full text-xs"
              disabled={busy}
              onChange={(event) => void readFiles(event.target.files)}
            />
          </label>
        </div>
        <label className="block text-sm">
          Folder name
          <input
            className={`${inputClass} mt-2`}
            value={name}
            maxLength={80}
            required
            disabled={busy}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        {rows.length > 0 && (
          <>
            <p className="text-sm">
              {included.length} / 64 included · {rows.length - included.length} excluded
            </p>
            <div className="max-h-72 overflow-auto rounded border border-gray-700">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-800 text-gray-400">
                  <tr>
                    <th className="p-3">File / internal name</th>
                    <th className="p-3">Destination slot</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className="border-t border-gray-800">
                      <td className="max-w-64 break-words p-3">
                        <div>{row.filename}</div>
                        <div
                          className={`text-xs ${row.error ? 'text-amber-300' : 'text-gray-400'}`}
                        >
                          {row.error ? `Excluded: ${row.error}` : row.entry?.name || 'Untitled'}
                        </div>
                      </td>
                      <td className="p-3">
                        <select
                          aria-label={`Slot for ${row.filename}`}
                          className={inputClass}
                          value={row.slot}
                          disabled={busy || !!row.error}
                          onChange={(event) =>
                            setRows(
                              rows.map((item, i) =>
                                i === index ? { ...item, slot: event.target.value } : item,
                              ),
                            )
                          }
                        >
                          <option value="?">Assign a slot…</option>
                          <option value="-">Exclude</option>
                          {Array.from({ length: SLOT_COUNT }, (_, slot) => (
                            <option key={slot} value={slot}>
                              {slotLabel(slot)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {ignored.length > 0 && (
          <details className="text-sm text-gray-400">
            <summary>{ignored.length} ignored non-patch or nested files</summary>
            <ul className="max-h-24 overflow-auto">
              {ignored.map((file, index) => (
                <li key={index}>{file}</li>
              ))}
            </ul>
          </details>
        )}
        {unresolved && (
          <p role="alert" className="text-sm text-amber-300">
            Resolve duplicate slots, assign unnumbered patches, and keep at most 64 patches.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" className={buttonClass} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className={primaryClass} disabled={busy || unresolved || !included.length}>
            {busy ? 'Reading / saving…' : 'Import reviewed folder'}
          </button>
        </div>
      </form>
    </FolderDialog>
  );
}
