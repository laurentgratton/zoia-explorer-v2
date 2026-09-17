import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(projectRoot, 'node_modules/libpd-wasm/assets/libpd-worklet.js');
const destination = resolve(projectRoot, 'public/libpd-wasm/libpd-worklet.js');

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
