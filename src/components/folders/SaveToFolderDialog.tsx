import React, { useEffect, useState } from 'react';
import { PatchFolder, patchFilename, slotLabel, validatePatchName } from '@/lib/zoia/folders';
import { serializePatch } from '@/lib/zoia/serializer';
import { getFolders, saveFolderPatch } from '@/services/db';
import { isPatchDirty, usePatchStore } from '@/store/patchStore';
import FolderDialog, { buttonClass, inputClass, primaryClass } from './FolderDialog';

export default function SaveToFolderDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const patch = usePatchStore((state) => state.patch);
  const source = usePatchStore((state) => state.source);
  const [folders, setFolders] = useState<PatchFolder[]>([]);
  const [folderId, setFolderId] = useState('');
  const [slot, setSlot] = useState(0);
  const [mode, setMode] = useState<'replace' | 'insert'>('replace');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getFolders()
      .then((items) => {
        if (!active) return;
        setFolders(items);
        const folder = items.find((item) => item.id === source?.folderId) ?? items[0];
        setFolderId(folder?.id ?? '');
        const origin = folder?.slots.findIndex((item) => item?.id === source?.entryId) ?? -1;
        setSlot(origin >= 0 ? origin : Math.max(0, folder?.slots.findIndex((item) => !item) ?? 0));
      })
      .catch((cause) => {
        if (active) setError(String(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [source]);
  const folder = folders.find((item) => item.id === folderId);
  const occupant = folder?.slots[slot];
  const ownSlot = folderId === source?.folderId && occupant?.id === source?.entryId;
  const canInsert = !ownSlot && !!folder?.slots.some((entry, index) => index >= slot && !entry);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!folder || !patch) return;
    setBusy(true);
    setError('');
    try {
      if (mode === 'replace' && occupant && !confirmed)
        throw new Error('Confirm the replacement below.');
      const state = usePatchStore.getState();
      const snapshot = state.patch!;
      if (snapshot.name !== state.baseline?.name) validatePatchName(snapshot.name);
      const data =
        !isPatchDirty(state) && state.savedData ? state.savedData : serializePatch(snapshot);
      const saved = await saveFolderPatch(
        folder.id,
        folder.revision,
        slot,
        mode,
        data,
        state.source,
        state.libraryId,
      );
      state.markSaved(snapshot, data, {
        folderId: saved.id,
        entryId: saved.slots[slot]!.id,
        loadedRevision: saved.revision,
      });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Save failed. Your draft is still open.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <FolderDialog title="Save to folder" onClose={onClose} busy={busy}>
      <form onSubmit={save} className="space-y-4">
        <div className="text-sm text-gray-400">
          Patch <strong className="ml-2 text-white">{patch?.name || 'Untitled'}</strong>
        </div>
        {loading ? (
          <p>Loading saved folders…</p>
        ) : !folders.length ? (
          <p className="text-sm text-amber-300">
            Create or import a folder in the Folders workspace first. Your draft will stay open.
          </p>
        ) : (
          <>
            <label className="block text-sm">
              Folder
              <select
                className={`${inputClass} mt-2`}
                value={folderId}
                disabled={busy}
                onChange={(event) => {
                  setFolderId(event.target.value);
                  setConfirmed(false);
                  setMode('replace');
                }}
              >
                {folders.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Target slot
              <select
                className={`${inputClass} mt-2`}
                value={slot}
                disabled={busy}
                onChange={(event) => {
                  setSlot(Number(event.target.value));
                  setConfirmed(false);
                  setMode('replace');
                }}
              >
                {folder?.slots.map((entry, index) => (
                  <option key={index} value={index}>
                    {slotLabel(index)} — {entry ? entry.name || 'Untitled' : 'Empty'}
                  </option>
                ))}
              </select>
            </label>
            <div
              className={`rounded border p-3 text-sm ${occupant ? 'border-amber-800 bg-amber-950/30 text-amber-200' : 'border-gray-700 text-gray-400'}`}
            >
              {occupant ? `Currently: ${occupant.name || 'Untitled'}` : 'This slot is empty.'}
            </div>
            <fieldset disabled={busy} className="space-y-3 text-sm">
              <legend className="sr-only">Placement</legend>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="placement"
                  checked={mode === 'replace'}
                  onChange={() => {
                    setMode('replace');
                    setConfirmed(false);
                  }}
                />
                {occupant ? 'Replace this slot' : 'Place in this slot'}
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name="placement"
                  className="mt-1"
                  checked={mode === 'insert'}
                  disabled={!canInsert}
                  onChange={() => {
                    setMode('insert');
                    setConfirmed(false);
                  }}
                />
                <span>
                  Insert and shift toward next empty slot
                  <span className="mt-1 block text-xs text-gray-400">
                    {ownSlot
                      ? 'Use Replace to update your source patch.'
                      : !canInsert
                        ? 'No empty slot at or after this target.'
                        : 'Only intervening patches move. Nothing is discarded.'}
                  </span>
                </span>
              </label>
            </fieldset>
            {mode === 'replace' && occupant && (
              <label className="flex items-start gap-2 text-sm text-amber-200">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={confirmed}
                  disabled={busy}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                Replace “{occupant.name || 'Untitled'}” in slot {slotLabel(slot)}.
              </label>
            )}
            <div className="rounded border border-gray-700 bg-gray-950 p-3 font-mono text-sm break-all">
              {patchFilename(slot, patch?.name || '')}
            </div>
            <p className="text-xs text-gray-400">
              Saved in this browser only. Other folder and library copies will not change.
            </p>
          </>
        )}
        {error && (
          <div role="alert" className="text-sm text-red-300">
            {error}
            <p className="mt-2 text-gray-400">
              Cancel and reopen this dialog to refresh destinations. Your draft is retained.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" className={buttonClass} disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button
            className={primaryClass}
            disabled={
              busy ||
              loading ||
              !folder ||
              (mode === 'replace' && !!occupant && !confirmed) ||
              (mode === 'insert' && !canInsert)
            }
          >
            {busy
              ? 'Saving…'
              : mode === 'insert'
                ? 'Insert patch'
                : occupant
                  ? 'Replace patch'
                  : 'Save patch'}
          </button>
        </div>
      </form>
    </FolderDialog>
  );
}
