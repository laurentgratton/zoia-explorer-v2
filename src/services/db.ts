import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { applyFolderOperation, EditorSource, FolderOperation, PatchFolder, patchFilename, readFolderEntry } from '@/lib/zoia/folders';

export interface StoredPatch {
  id: string;
  name: string;
  data: ArrayBuffer;
  createdAt: Date;
}

interface ZoiaDB extends DBSchema {
  folders: { key: string; value: PatchFolder };
  patches: {
    key: string;
    value: StoredPatch;
    indexes: { 'by-date': Date };
  };
}

const DB_NAME = 'zoia-patch-db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<ZoiaDB>> | null = null;

function getDB() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available server-side'));
  }
  if (!dbPromise) {
    dbPromise = openDB<ZoiaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('patches')) {
          const store = db.createObjectStore('patches', {
            keyPath: 'id',
          });
          store.createIndex('by-date', 'createdAt');
        }
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id' });
        }
      },
      blocked() {
        window.alert('Close other ZOIA Explorer tabs to finish upgrading browser storage. Your patches will be kept.');
      },
      blocking() {
        void dbPromise?.then(db => db.close());
        dbPromise = null;
      },
      terminated() {
        dbPromise = null;
      },
    }).catch(error => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

export async function addPatch(name: string, data: ArrayBuffer): Promise<string> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const patch: StoredPatch = {
    id,
    name,
    data,
    createdAt: new Date(),
  };
  await db.add('patches', patch);
  return id;
}

export async function getAllPatches(): Promise<StoredPatch[]> {
  const db = await getDB();
  return db.getAllFromIndex('patches', 'by-date');
}

export async function deletePatch(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('patches', id);
}

export async function getFolders(): Promise<PatchFolder[]> {
  const db = await getDB();
  return (await db.getAll('folders')).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFolder(id: string): Promise<PatchFolder> {
  const db = await getDB();
  const folder = await db.get('folders', id);
  if (!folder) throw new Error('This folder no longer exists. Refresh the folder list.');
  return folder;
}

export async function addFolder(folder: PatchFolder): Promise<void> {
  const db = await getDB();
  await db.add('folders', folder);
}

// Revision checking and the write share a transaction, including across browser tabs.
async function writeFolder(id: string, expectedRevision: number, change: (folder: PatchFolder) => PatchFolder | null, libraryRename?: { id: string; name: string }) {
  const db = await getDB();
  const tx = db.transaction(libraryRename ? ['folders', 'patches'] : ['folders'], 'readwrite');
  const folders = tx.objectStore('folders');
  try {
    const folder = await folders.get(id);
    if (!folder) throw new Error('This folder no longer exists. Refresh the folder list.');
    if (folder.revision !== expectedRevision) throw new Error('This folder changed. Refresh and review your action before trying again.');
    const updated = change(folder);
    if (updated) await folders.put(updated);
    else await folders.delete(id);
    if (libraryRename) {
      const patches = tx.objectStore('patches');
      const patch = await patches.get(libraryRename.id);
      // A deleted library copy must not be recreated by saving its open draft.
      if (patch) await patches.put({ ...patch, name: libraryRename.name });
    }
    await tx.done;
    return updated;
  } catch (error) {
    try { tx.abort(); } catch { /* Transaction may already have aborted. */ }
    await tx.done.catch(() => {});
    throw error;
  }
}

export async function mutateFolder(id: string, revision: number, operation: FolderOperation): Promise<PatchFolder> {
  return (await writeFolder(id, revision, folder => applyFolderOperation(folder, operation)))!;
}

export async function deleteFolder(id: string, revision: number): Promise<void> {
  await writeFolder(id, revision, () => null);
}

export async function saveFolderPatch(id: string, revision: number, slot: number, mode: 'replace' | 'insert', data: ArrayBuffer, source: EditorSource | null, libraryId?: string | null): Promise<PatchFolder> {
  const entry = readFolderEntry(data);
  return (await writeFolder(id, revision, folder => {
    if (source?.folderId === id) {
      if (source.loadedRevision !== folder.revision) {
        throw new Error('The source folder changed since this draft was opened. Reopen the saved patch, or save this draft into a different folder.');
      }
      const origin = folder.slots.findIndex(item => item?.id === source.entryId);
      if (origin < 0) throw new Error('The original patch was removed. Choose another folder for this draft.');
      if (origin === slot) {
        if (mode === 'insert') throw new Error('Use Replace to update this patch in its own slot.');
        entry.id = source.entryId;
        entry.originalFilename = folder.slots[origin]?.originalFilename;
      }
    }
    return applyFolderOperation(folder, { type: 'place', slot, entry, mode });
  }, libraryId ? { id: libraryId, name: patchFilename(slot, entry.name) } : undefined))!;
}
