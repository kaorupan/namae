import test from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import yoji from "../data/yoji.mjs";
import koto from "../data/kotowaza.mjs";
const K = JSON.parse(readFileSync(new URL("../data/kanji.json", import.meta.url)));

test("漢字：常用2136字・人名用あり・画数と部首がそろう", () => {
  assert.strictEqual(K.filter((k) => k.type === "joyo").length, 2136);
  assert.ok(K.filter((k) => k.type === "jinmei").length > 600);
  for (const k of K) assert.ok(k.strokes > 0 && k.rad > 0, k.ch);
  assert.strictEqual(K.find((k) => k.ch === "海").strokes, 9);
});
for (const [name, list] of [["四字熟語", yoji], ["ことわざ", koto]]) test(name + "：読み・意味・例文がそろい、重ならない", () => {
  const seen = new Set();
  for (const [w, y, m, ex] of list) {
    assert.ok(!seen.has(w), w); seen.add(w);
    assert.match(y, /^[ぁ-ゖー]+$/, w);
    assert.ok(m.length > 8 && ex.includes(w.slice(0, 2)), w);
  }
});
