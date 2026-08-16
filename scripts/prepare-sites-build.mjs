import { copyFile, mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = new URL('../', import.meta.url);
const projectRootPath = fileURLToPath(projectRoot);
const distDirectory = resolve(projectRootPath, 'dist');
const clientDirectory = resolve(distDirectory, 'client');
const serverDirectory = new URL('dist/server/', projectRoot);

// Sites deploys Vinext-compatible archives with client assets in dist/client.
// A plain Vite build emits those files at the dist root, so move only the
// browser output before adding the Worker entry point.
await rm(clientDirectory, { recursive: true, force: true });
await mkdir(clientDirectory, { recursive: true });

for (const entry of await readdir(distDirectory, { withFileTypes: true })) {
  if (entry.name === 'client' || entry.name === 'server' || entry.name === '.openai') {
    continue;
  }

  await rename(resolve(distDirectory, entry.name), resolve(clientDirectory, entry.name));
}

await mkdir(serverDirectory, { recursive: true });
await copyFile(new URL('sites-worker.js', projectRoot), new URL('index.js', serverDirectory));

await writeFile(
  new URL('wrangler.json', serverDirectory),
  `${JSON.stringify(
    {
      name: 'mandatum',
      main: 'index.js',
      compatibility_date: '2026-08-17',
      no_bundle: true,
      rules: [{ type: 'ESModule', globs: ['**/*.js', '**/*.mjs'] }],
      assets: {
        directory: '../client',
        binding: 'ASSETS',
        not_found_handling: 'single-page-application',
      },
    },
    null,
    2,
  )}\n`,
  'utf8',
);

