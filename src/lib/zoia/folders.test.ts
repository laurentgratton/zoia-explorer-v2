import {
  applyFolderOperation,
  createFolder,
  readFolderEntry,
  importFolder,
  exportFolderZip,
} from './folders';
import { unzipSync } from 'fflate';
import { serializePatch } from './serializer';

const entry = (name: string) =>
  readFolderEntry(serializePatch({ name, modules: [], connections: [], pageNames: [] }));

test('insertion shifts only through the first forward empty slot without changing bytes', () => {
  const folder = createFolder('Live Set');
  const a = entry('A'),
    b = entry('B'),
    c = entry('C'),
    x = entry('X');
  folder.slots[4] = a;
  folder.slots[5] = b;
  folder.slots[7] = c;
  const result = applyFolderOperation(folder, { type: 'place', slot: 4, entry: x, mode: 'insert' });
  expect(result.slots.slice(4, 8).map((value) => value?.name)).toEqual(['X', 'A', 'B', 'C']);
  expect(result.slots[5]?.data).toEqual(a.data);
  expect(folder.slots[4]?.id).toBe(a.id);
  expect(result.revision).toBe(folder.revision + 1);
});

test('slot operations preserve independent copies, gaps, and forward capacity', () => {
  let folder = createFolder('Set');
  folder.slots[62] = entry('Last but one');
  folder.slots[63] = entry('Last');
  expect(() =>
    applyFolderOperation(folder, { type: 'place', slot: 62, entry: entry('X'), mode: 'insert' }),
  ).toThrow('No empty slot');
  folder = applyFolderOperation(folder, { type: 'duplicate', from: 62, to: 0 });
  expect(folder.slots[0]?.id).not.toBe(folder.slots[62]?.id);
  expect(folder.slots[0]?.data).toEqual(folder.slots[62]?.data);
  expect(() => applyFolderOperation(folder, { type: 'move', from: 62, to: 63 })).toThrow(
    'occupied',
  );
  folder = applyFolderOperation(folder, { type: 'swap', from: 62, to: 63 });
  expect(folder.slots[62]?.name).toBe('Last');
  folder = applyFolderOperation(folder, { type: 'move', from: 63, to: 4 });
  expect(folder.slots[63]).toBeNull();
  folder = applyFolderOperation(folder, { type: 'remove', slot: 4 });
  expect(folder.slots[4]).toBeNull();
  expect(folder.slots[62]?.name).toBe('Last');
  folder = applyFolderOperation(folder, {
    type: 'place',
    slot: 63,
    entry: entry('Replacement'),
    mode: 'replace',
  });
  expect(folder.slots[63]?.name).toBe('Replacement');
});

test('reviewed imports reject slot conflicts and export original bytes with safe numbered names', () => {
  const original = entry('Old');
  new Uint8Array(original.data)[30000] = 197; // Preserve data the editor does not model.
  expect(() =>
    importFolder('Set', [
      { slot: 1, entry: original },
      { slot: 1, entry: entry('Other') },
    ]),
  ).toThrow('Duplicate');
  const folder = importFolder(
    '../Live Set',
    Array.from({ length: 64 }, (_, slot) => ({
      slot,
      entry: { ...original, id: crypto.randomUUID() },
    })),
  );
  const renamed = applyFolderOperation(folder, {
    type: 'rename-patch',
    slot: 3,
    name: 'Warm / Delay',
  });
  const expected = original.data.slice(0);
  new Uint8Array(expected).fill(0, 4, 20);
  new Uint8Array(expected).set(new TextEncoder().encode('Warm / Delay'), 4);
  expect(renamed.slots[3]?.data).toEqual(expected);
  expect(() =>
    applyFolderOperation(folder, { type: 'rename-patch', slot: 3, name: 'Longer than sixteen' }),
  ).toThrow('16');
  const files = unzipSync(exportFolderZip(renamed));
  expect(Object.keys(files)).toHaveLength(64);
  expect(files['Live_Set/003_Warm_Delay.bin']).toEqual(new Uint8Array(expected));
  expect(files['Live_Set/063_Old.bin']).toEqual(new Uint8Array(original.data));
  expect(() => exportFolderZip(createFolder('Empty'))).toThrow('empty');
  expect(() => exportFolderZip(importFolder('Sparse', [{ slot: 3, entry: original }]))).toThrow(
    'Partial',
  );
});
