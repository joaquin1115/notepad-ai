const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = join(__dirname, '..');

test('page title is Notepad', () => {
  const html = readFileSync(join(root, 'public', 'index.html'), 'utf8');
  assert.match(html, /<title>Notepad<\/title>/);
});

test('keyboard shortcut is Ctrl or Command plus Enter', () => {
  const script = readFileSync(join(root, 'public', 'app.js'), 'utf8');
  assert.match(script, /event\.ctrlKey \|\| event\.metaKey/);
  assert.match(script, /event\.key === 'Enter'/);
});

test('client waits for the complete response before appending text', () => {
  const script = readFileSync(join(root, 'public', 'app.js'), 'utf8');
  assert.match(script, /await fetch/);
  assert.match(script, /appendAnswer\(payload\.text\)/);
});
