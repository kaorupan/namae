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
import yurai from "../data/yurai.mjs";
test("由来は、載せている四字熟語・ことわざのものだけ", () => {
  const all = new Set([...yoji, ...koto].map((r) => r[0]));
  for (const k of Object.keys(yurai)) assert.ok(all.has(k), "由来の言葉がない: " + k);
});
import names from "../data/names.mjs";
import kazu from "../data/kazu.mjs";
test("名前の候補：名前に使える字（常用・人名用漢字、かな、々）だけ", () => {
  const ok = new Set(K.map((k) => k.ch));
  for (const n of names) for (const c of n.mei) assert.ok(ok.has(c) || /[ぁ-ゖァ-ヺー々]/.test(c), n.mei + " の「" + c + "」");
});
test("画数の意味：1〜81がすべてそろう", () => {
  for (let n = 1; n <= 81; n++) assert.ok(Array.isArray(kazu[n]) && kazu[n].length === 4 && kazu[n].every((t) => t.length > 10), String(n));
});
