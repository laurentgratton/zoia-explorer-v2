import { parsePatch } from './parser';
import { zipSync } from 'fflate';

export const SLOT_COUNT = 64;

export interface FolderEntry {
  id: string;
  name: string;
  data: ArrayBuffer;
  originalFilename?: string;
}

export interface PatchFolder {
  id: string;
  name: string;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
  slots: (FolderEntry | null)[];
}

export interface EditorSource {
  folderId: string;
  entryId: string;
  loadedRevision: number;
}

export type FolderOperation =
  | { type: 'place'; slot: number; entry: FolderEntry; mode: 'replace' | 'insert' }
  | { type: 'move' | 'swap' | 'duplicate'; from: number; to: number }
  | { type: 'remove'; slot: number }
  | { type: 'rename-patch'; slot: number; name: string }
  | { type: 'rename-folder'; name: string };

export function createFolder(name: string): PatchFolder {
  if (!name.trim()) throw new Error('Enter a folder name.');
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    revision: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    slots: Array(SLOT_COUNT).fill(null),
  };
}

export function readFolderEntry(data: ArrayBuffer, originalFilename?: string): FolderEntry {
  const patch = parsePatch(data);
  return { id: crypto.randomUUID(), name: patch.name, data: data.slice(0), originalFilename };
}

function checkSlot(slot: number) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= SLOT_COUNT)
    throw new Error('Choose a slot from 000 to 063.');
}

export function applyFolderOperation(folder: PatchFolder, operation: FolderOperation): PatchFolder {
  const slots = [...folder.slots];
  let name = folder.name;
  if (operation.type === 'place') {
    checkSlot(operation.slot);
    if (operation.mode === 'insert') {
      const empty = slots.findIndex((entry, index) => index >= operation.slot && !entry);
      if (empty < 0)
        throw new Error('No empty slot at or after the target. Replace a slot instead.');
      for (let index = empty; index > operation.slot; index--) slots[index] = slots[index - 1];
    }
    slots[operation.slot] = operation.entry;
  } else if (operation.type === 'remove') {
    checkSlot(operation.slot);
    slots[operation.slot] = null;
  } else if (operation.type === 'rename-folder') {
    if (!operation.name.trim()) throw new Error('Enter a folder name.');
    name = operation.name.trim();
  } else if (operation.type === 'rename-patch') {
    checkSlot(operation.slot);
    const entry = slots[operation.slot];
    if (!entry) throw new Error('The source slot is empty.');
    validatePatchName(operation.name);
    const data = entry.data.slice(0);
    const bytes = new Uint8Array(data);
    bytes.fill(0, 4, 20);
    bytes.set(new TextEncoder().encode(operation.name), 4);
    slots[operation.slot] = { ...entry, name: operation.name, data };
  } else {
    checkSlot(operation.from);
    checkSlot(operation.to);
    const source = slots[operation.from];
    if (!source) throw new Error('The source slot is empty.');
    if (operation.type === 'swap') {
      if (!slots[operation.to]) throw new Error('Choose an occupied slot to swap.');
      [slots[operation.from], slots[operation.to]] = [slots[operation.to], source];
    } else {
      if (slots[operation.to]) throw new Error('Target slot is occupied. Choose Swap instead.');
      slots[operation.to] =
        operation.type === 'duplicate'
          ? { ...source, id: crypto.randomUUID(), data: source.data.slice(0) }
          : source;
      if (operation.type === 'move') slots[operation.from] = null;
    }
  }
  return { ...folder, name, slots, revision: folder.revision + 1, updatedAt: new Date() };
}

export function validatePatchName(name: string) {
  if (name.length > 16 || !/^[\x20-\x7e]*$/.test(name)) {
    throw new Error('Patch names must contain at most 16 printable ASCII characters.');
  }
}

export const slotLabel = (slot: number) => String(slot).padStart(3, '0');
export const safeFilename = (name: string) =>
  name.replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'Untitled';
export const patchFilename = (slot: number, name: string) =>
  `${slotLabel(slot)}_${safeFilename(name)}.bin`;

export function importFolder(
  name: string,
  assignments: { slot: number; entry: FolderEntry }[],
): PatchFolder {
  const folder = createFolder(name);
  for (const { slot, entry } of assignments) {
    checkSlot(slot);
    if (folder.slots[slot]) throw new Error(`Duplicate assignment to slot ${slotLabel(slot)}.`);
    folder.slots[slot] = { ...entry, id: crypto.randomUUID(), data: entry.data.slice(0) };
  }
  return folder;
}

export function exportFolderZip(folder: PatchFolder): Uint8Array {
  const count = folder.slots.filter(Boolean).length;
  if (!count) throw new Error('Cannot export an empty folder.');
  if (count !== SLOT_COUNT)
    throw new Error(
      'Partial-folder export is not available yet: missing-slot behavior must first be verified on a ZOIA. Full 64-slot folders can export.',
    );
  const files: Record<string, Uint8Array> = {};
  folder.slots.forEach((entry, slot) => {
    if (entry)
      files[`${safeFilename(folder.name)}/${patchFilename(slot, entry.name)}`] = new Uint8Array(
        entry.data,
      );
  });
  return zipSync(files, { level: 0 });
}
