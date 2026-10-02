import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const folders = (await readdir(root)).filter(v => /^\d{2}-/.test(v));
const localFolders = folders.filter(folder => !['20-notion-finance', '21-weight-realm'].includes(folder));
test('nineteen local widgets and two connected widgets exist', async () => {
  assert.equal(localFolders.length, 19);
  assert.equal(folders.length, 21);
  for (const folder of folders) {
    for (const file of ['index.html', 'script.js', 'styles.css']) await access(path.join(root, folder, file));
  }
  for (const folder of localFolders) {
    for (const file of ['core.js', 'theme.css', 'README.md']) await access(path.join(root, folder, file));
  }
});
test('local imports resolve inside each standalone folder', async () => {
  for (const folder of folders) {
    const base = path.join(root, folder);
    for (const name of (await readdir(base)).filter(v => v.endsWith('.js'))) {
      const content = await readFile(path.join(base, name), 'utf8');
      for (const match of content.matchAll(/from\s+['"](.+?)['"]/g)) {
        assert.ok(match[1].startsWith('./'), folder + ': unexpected remote or parent import');
        await access(path.resolve(base, match[1]));
      }
    }
  }
});
test('shared runtime and theme copies match', async () => {
  for (const file of ['core.js', 'theme.css']) {
    const expected = await readFile(path.join(root, folders[0], file), 'utf8');
    for (const folder of localFolders) assert.equal(await readFile(path.join(root, folder, file), 'utf8'), expected);
  }
});
test('quote image is bundled and no records are shipped', async () => {
  const bytes = await readFile(path.join(root, '03-quote/assets/quote-background.png'));
  assert.ok(bytes.length > 1000);
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  for (const folder of folders) {
    const content = await readFile(path.join(root, folder, 'script.js'), 'utf8');
    assert.equal(content.includes('QA expense'), false);
    assert.equal(content.includes('QA reading'), false);
  }
});
