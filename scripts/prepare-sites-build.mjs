import { copyFile, mkdir } from 'node:fs/promises';

const projectRoot = new URL('../', import.meta.url);
const serverDirectory = new URL('dist/server/', projectRoot);

await mkdir(serverDirectory, { recursive: true });
await copyFile(new URL('sites-worker.js', projectRoot), new URL('index.js', serverDirectory));

