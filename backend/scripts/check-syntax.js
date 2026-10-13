import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(resolve(directory, entry.name))
          : entry.name.endsWith('.js')
            ? [resolve(directory, entry.name)]
            : [],
      ),
    )
  ).flat();
}
const paths = [
  resolve(root, 'server.js'),
  ...(await files(resolve(root, 'src'))),
  ...(await files(resolve(root, 'tests'))),
  ...(await files(resolve(root, 'scripts'))),
];
for (const path of paths) {
  const result = spawnSync(process.execPath, ['--check', path], {
    stdio: 'inherit',
  });
  if (result.status !== 0 || result.error) {
    console.error('JavaScript syntax check failed.');
    process.exit(1);
  }
}
console.log(`JavaScript syntax checks passed (${paths.length} files).`);
