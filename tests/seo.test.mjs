import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('苑の検索タイトル・説明文は本文の読みと一致し、canonicalを保つ', () => {
  const html = readFileSync(new URL('../kanji/苑/index.html', import.meta.url), 'utf8');
  const title = html.match(/<title>(.*?)<\/title>/)[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)[1];
  assert.equal(title, '苑の読み方・意味｜音読み・訓読みと名前に使うときの画数');
  assert.ok(html.includes(`<meta property="og:title" content="${title}">`));
  assert.ok(html.includes(`<meta property="og:description" content="${description}">`));
  assert.ok(description.includes('音読みは「えん・おん・うつ・うん」'));
  assert.ok(description.includes('訓読みは「その」'));
  assert.ok(Array.from(description).length <= 120);
  assert.ok(html.includes('href="https://namae-kanji.com/kanji/%E8%8B%91/"'));
});
