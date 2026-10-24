const test = require("node:test"), assert = require("node:assert");
const S = require("../assets/js/seimei.js"), C = require("../assets/js/core.js"), L = require("../assets/js/luck.js");
const { LIST } = require("../assets/js/ijin.js");

test("佐藤太郎の五格と評価", () => {
  const r = S.calculateSeimei({ sei: "佐藤", mei: "太郎" });
  assert.ok(r.ok);
  assert.deepStrictEqual([r.ten.value, r.jin.value, r.chi.value, r.sou.value], [25, 22, 13, 38]);
  assert.strictEqual(C.rate(r).mark.mark, "〇");
});
test("評価は4段階だけ（×はない）", () => {
  assert.deepStrictEqual(C.MARKS.map((m) => m.mark), ["💮", "◎", "〇", "△"]);
});
test("似ている偉人：同じ名前ならそっくりで最上位", () => {
  const r = S.calculateSeimei({ sei: "坂本", mei: "龍馬" });
  const sim = C.similar(r, LIST, S.calculateSeimei, 3);
  assert.strictEqual(sim[0].level.key, "same");
  assert.ok(sim.length <= 3);
});
test("偉人はすべて計算でき、スラッグが重ならない", () => {
  const slugs = new Set();
  for (const p of LIST) {
    assert.ok(S.calculateSeimei({ sei: p.sei, mei: p.mei }).ok, p.sei + p.mei);
    assert.ok(!slugs.has(p.slug)); slugs.add(p.slug);
    assert.ok(p.died && p.died < 1990, "歴史上の人物だけ: " + p.slug);
  }
});
test("luck は81を超えても1〜81にもどす", () => {
  assert.strictEqual(L.of(82).n, 2);
  assert.strictEqual(L.of(81).luck, "大吉");
});
