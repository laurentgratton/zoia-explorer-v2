import React, { useCallback, useEffect, useState } from 'react';
import {
  createFolder,
  exportFolderZip,
  PatchFolder,
  patchFilename,
  safeFilename,
  slotLabel,
} from '@/lib/zoia/folders';
import { parsePatch } from '@/lib/zoia/parser';
import { addFolder, deleteFolder, getFolder, getFolders, mutateFolder } from '@/services/db';
import { isPatchDirty, usePatchStore } from '@/store/patchStore';
import FolderDialog, { buttonClass, inputClass, primaryClass } from './FolderDialog';
import ImportFolderDialog from './ImportFolderDialog';

type Action =
  | { type: 'new' }
  | {
      type:
        | 'rename-folder'
        | 'delete'
        | 'rename-patch'
        | 'remove'
        | 'move'
        | 'swap'
        | 'duplicate'
        | 'export';
      folder: PatchFolder;
      slot: number;
    };

export default function FolderWorkspace({
  onEdit,
  onRequestSave,
  refreshKey,
}: {
  onEdit: () => void;
  onRequestSave: (after?: () => void) => void;
  refreshKey: number;
}) {
  const [folders, setFolders] = useState<PatchFolder[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [value, setValue] = useState('');
  const [destination, setDestination] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [persistent, setPersistent] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setFolders(await getFolders());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Cannot read browser storage.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [refresh, refreshKey]);
  const folder = folders.find((item) => item.id === selectedId) ?? folders[0];
  const entry = folder?.slots[selectedSlot];

  function openAction(type: Action['type']) {
    setError('');
    setNotice('');
    if (type === 'new') {
      setValue('');
      setAction({ type });
      return;
    }
    if (!folder) return;
    setValue(type === 'rename-folder' ? folder.name : (entry?.name ?? ''));
    setDestination(
      Math.max(
        0,
        folder.slots.findIndex(
          (item, index) => index !== selectedSlot && (type === 'swap' ? !!item : !item),
        ),
      ),
    );
    setAction({ type, folder, slot: selectedSlot });
  }

  async function execute(event: React.FormEvent) {
    event.preventDefault();
    if (!action) return;
    setBusy(true);
    setError('');
    try {
      if (action.type === 'new') {
        const created = createFolder(value);
        await addFolder(created);
        setSelectedId(created.id);
        setSelectedSlot(0);
      } else if (action.type === 'delete') {
        await deleteFolder(action.folder.id, action.folder.revision);
        setSelectedId('');
        setSelectedSlot(0);
      } else if (action.type !== 'export') {
        const operation =
          action.type === 'move' || action.type === 'swap' || action.type === 'duplicate'
            ? { type: action.type, from: action.slot, to: destination }
            : action.type === 'rename-folder'
              ? { type: action.type, name: value }
              : action.type === 'rename-patch'
                ? { type: action.type, slot: action.slot, name: value }
                : { type: action.type, slot: action.slot };
        await mutateFolder(action.folder.id, action.folder.revision, operation);
      }
      setAction(null);
      setNotice('Saved in browser.');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save. Nothing was changed.');
    } finally {
      setBusy(false);
    }
  }

  async function download(id: string) {
    setBusy(true);
    setError('');
    try {
      const saved = await getFolder(id);
      const bytes = exportFolderZip(saved);
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(bytes)], { type: 'application/zip' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeFilename(saved.name)}.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(
        'Download started. Extract into a fresh SD-card folder to avoid stale numbered files.',
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Export failed.');
    } finally {
      setBusy(false);
    }
  }

  function requestExport() {
    if (!folder) return;
    const state = usePatchStore.getState();
    if (state.source?.folderId === folder.id && isPatchDirty(state)) openAction('export');
    else void download(folder.id);
  }

  function edit() {
    if (!folder || !entry) return;
    try {
      usePatchStore
        .getState()
        .requestPatch(
          parsePatch(entry.data),
          { folderId: folder.id, entryId: entry.id, loadedRevision: folder.revision },
          entry.data,
        );
      onEdit();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Cannot open this patch.');
    }
  }

  const actionTitle =
    action?.type === 'new'
      ? 'Create folder'
      : action?.type === 'delete'
        ? 'Delete folder'
        : action?.type === 'rename-folder'
          ? 'Rename folder'
          : action?.type === 'rename-patch'
            ? 'Rename patch'
            : action?.type === 'export'
              ? 'Export saved version?'
              : `${action?.type ? action.type[0].toUpperCase() + action.type.slice(1) : ''} patch`;

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-900 text-gray-200 md:flex-row">
      <aside className="shrink-0 border-b border-gray-700 bg-gray-950/40 p-4 md:w-56 md:border-r md:border-b-0 md:overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Folders</h2>
          <button
            className={buttonClass}
            onClick={() => openAction('new')}
            aria-label="Create folder"
          >
            +
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto md:flex-col">
          {folders.map((item) => (
            <button
              key={item.id}
              aria-pressed={item.id === folder?.id}
              onClick={() => {
                setSelectedId(item.id);
                setSelectedSlot(0);
                setError('');
                setNotice('');
              }}
              className={`shrink-0 rounded border px-3 py-3 text-left text-sm md:shrink ${item.id === folder?.id ? 'border-violet-500 bg-violet-500/15 text-violet-100' : 'border-transparent hover:bg-gray-800'}`}
            >
              <span className="block truncate">{item.name}</span>
              <span className="text-xs text-gray-400">
                {item.slots.filter(Boolean).length} / 64 patches
              </span>
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs leading-relaxed text-gray-500">
          Stored in this browser, not synced to disk. Export backups before clearing site data.
        </p>
        <button
          className="mt-2 text-xs text-violet-300 underline"
          onClick={async () => {
            try {
              const granted = await navigator.storage?.persist?.();
              setPersistent(!!granted);
              setNotice(
                granted
                  ? 'Persistent storage granted. Export is still your backup.'
                  : 'Persistent storage was not granted. Keep ZIP backups.',
              );
            } catch {
              setNotice('Persistent storage is unavailable. Keep ZIP backups.');
            }
          }}
        >
          {persistent ? 'Storage persistence granted' : 'Request persistent storage'}
        </button>
      </aside>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-700 p-5">
          <div>
            <h1 className="text-xl font-semibold text-white">
              {folder?.name ?? 'Your patch folders'}
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              {folder
                ? `${folder.slots.filter(Boolean).length} / 64 occupied · slots 000–063`
                : 'Prepare a set for your ZOIA'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={buttonClass}
              onClick={() => {
                setError('');
                void refresh();
              }}
              disabled={busy}
            >
              Refresh
            </button>
            <button className={buttonClass} onClick={() => setImporting(true)} disabled={busy}>
              Import folder
            </button>
            <button className={primaryClass} onClick={requestExport} disabled={!folder || busy}>
              Export ZIP
            </button>
          </div>
        </header>
        {error && (
          <p
            role="alert"
            className="border-b border-red-900 bg-red-950/30 px-5 py-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="border-b border-gray-700 px-5 py-3 text-sm text-violet-200">
            {notice}
          </p>
        )}
        {loading ? (
          <p className="p-8">Loading folders…</p>
        ) : !folder ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="text-4xl text-violet-400">▤</div>
            <h2 className="text-xl text-white">A place for every patch</h2>
            <p className="max-w-sm text-sm text-gray-400">
              Import a folder from your SD card, or create an empty set and save patches from the
              editor.
            </p>
            <button className={primaryClass} onClick={() => setImporting(true)}>
              Import your first folder
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-700 bg-gray-800/40 px-5 py-3">
              <span className="text-xs text-gray-400">
                Selected: {slotLabel(selectedSlot)} ·{' '}
                {entry?.name || (entry ? 'Untitled' : 'Empty')}
              </span>
              <div className="flex flex-wrap gap-2">
                <button className={primaryClass} onClick={edit} disabled={!entry || busy}>
                  Edit
                </button>
                {(['move', 'swap', 'duplicate', 'rename-patch', 'remove'] as const).map((type) => (
                  <button
                    key={type}
                    className={buttonClass}
                    disabled={!entry || busy}
                    onClick={() => openAction(type)}
                  >
                    {type === 'rename-patch' ? 'Rename' : type[0].toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-800 text-xs uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="w-20 px-5 py-3">Slot</th>
                    <th className="px-3 py-3">Patch</th>
                    <th className="hidden px-3 py-3 sm:table-cell">Export filename</th>
                  </tr>
                </thead>
                <tbody>
                  {folder.slots.map((item, slot) => (
                    <tr
                      key={slot}
                      className={`border-b border-gray-800 ${selectedSlot === slot ? 'bg-violet-500/15' : 'hover:bg-gray-800/60'}`}
                    >
                      <td className="px-5 py-1 font-mono text-gray-400">{slotLabel(slot)}</td>
                      <td className="px-3 py-1">
                        <button
                          className={`w-full rounded py-3 text-left focus-visible:outline-2 focus-visible:outline-violet-400 ${item ? 'text-gray-100' : 'text-gray-500'}`}
                          aria-pressed={selectedSlot === slot}
                          aria-label={`Select slot ${slotLabel(slot)}: ${item?.name || (item ? 'Untitled' : 'Empty')}`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {item?.name || (item ? 'Untitled' : 'Empty')}
                        </button>
                      </td>
                      <td className="hidden px-3 py-1 font-mono text-xs text-gray-500 sm:table-cell">
                        {item ? patchFilename(slot, item.name) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-700 px-5 py-3">
              <p className="max-w-lg text-xs text-gray-500">
                ZIP export skips empty slots and preserves patch slot numbers. Extract into a
                fresh SD-card folder to avoid stale numbered files.
              </p>
              <div className="flex gap-2">
                <button className={buttonClass} onClick={() => openAction('rename-folder')}>
                  Rename folder
                </button>
                <button className={buttonClass} onClick={() => openAction('delete')}>
                  Delete folder
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
      {importing && (
        <ImportFolderDialog
          onClose={() => setImporting(false)}
          onImported={(id) => {
            setImporting(false);
            setSelectedId(id);
            setSelectedSlot(0);
            setNotice('Imported a browser copy. Disk files were not changed.');
            void refresh();
          }}
        />
      )}
      {action && (
        <FolderDialog
          title={actionTitle}
          busy={busy}
          onClose={() => {
            setAction(null);
            setError('');
          }}
        >
          {action.type === 'export' ? (
            <div className="space-y-4">
              <p className="text-sm">
                Your editor has unsaved changes. Export uses the saved folder, not the draft.
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <button className={buttonClass} onClick={() => setAction(null)}>
                  Cancel
                </button>
                <button
                  className={buttonClass}
                  onClick={() => {
                    setAction(null);
                    void download(action.folder.id);
                  }}
                >
                  Export saved version
                </button>
                <button
                  className={primaryClass}
                  onClick={() => {
                    const id = action.folder.id;
                    setAction(null);
                    onRequestSave(() => {
                      if (usePatchStore.getState().source?.folderId === id) {
                        void download(id);
                      } else {
                        setNotice('Saved to a different folder. Select that folder to export it.');
                      }
                    });
                  }}
                >
                  Save first…
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={execute} className="space-y-4">
              {action.type === 'new' ||
              action.type === 'rename-folder' ||
              action.type === 'rename-patch' ? (
                <label className="block text-sm">
                  Name
                  <input
                    className={`${inputClass} mt-2`}
                    value={value}
                    required={action.type !== 'rename-patch'}
                    maxLength={action.type === 'rename-patch' ? 16 : 80}
                    onChange={(event) => setValue(event.target.value)}
                    disabled={busy}
                  />
                </label>
              ) : action.type === 'delete' ? (
                <p className="text-sm">
                  Delete “{action.folder.name}” and all its browser copies? Disk files and other
                  folders stay unchanged.
                </p>
              ) : action.type === 'remove' ? (
                <p className="text-sm">
                  Remove “{action.folder.slots[action.slot]?.name || 'Untitled'}” from{' '}
                  {slotLabel(action.slot)}? This leaves an empty slot.
                </p>
              ) : (
                <label className="block text-sm">
                  Destination for {slotLabel(action.slot)}
                  <select
                    className={`${inputClass} mt-2`}
                    value={destination}
                    onChange={(event) => setDestination(Number(event.target.value))}
                    disabled={busy}
                  >
                    {action.folder.slots.map((item, slot) => (
                      <option
                        key={slot}
                        value={slot}
                        disabled={slot === action.slot || (action.type === 'swap' ? !item : !!item)}
                      >
                        {slotLabel(slot)} — {item ? item.name || 'Untitled' : 'Empty'}
                      </option>
                    ))}
                  </select>
                  <span className="mt-2 block text-xs text-gray-400">
                    Move and Duplicate require an empty destination. Swap exchanges occupied slots.
                  </span>
                </label>
              )}
              {error && (
                <p role="alert" className="text-sm text-red-300">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className={buttonClass}
                  disabled={busy}
                  onClick={() => {
                    setAction(null);
                    setError('');
                  }}
                >
                  Cancel
                </button>
                <button className={primaryClass} disabled={busy}>
                  {busy ? 'Saving…' : actionTitle}
                </button>
              </div>
            </form>
          )}
        </FolderDialog>
      )}
    </div>
  );
}
