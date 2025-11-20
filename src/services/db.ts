import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface StoredPatch {
  id: string;
  name: string;
  data: ArrayBuffer;
  createdAt: Date;
}

interface ZoiaDB extends DBSchema {
  patches: {
    key: string;
    value: StoredPatch;
    indexes: { 'by-date': Date };
  };
}

const DB_NAME = 'zoia-patch-db';
const DB_VERSION = 1;

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
      },
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
