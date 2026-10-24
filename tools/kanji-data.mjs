// 漢字辞典のデータを作る：node tools/kanji-data.mjs → data/kanji.json
//   出典（@mandel59/mojidata に入っているもの）
//     常用漢字表（文化庁）… 読み・例・備考。告示は著作権の対象外（著作権法第13条第2号）
//     Unicode Unihan（Unicode License v3）… 画数・部首・人名用漢字・人名用漢字の読み・旧字体
//   ここで作った JSON をリポジトリに入れておき、ページを作るときは JSON だけを使う。
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const Database = require("better-sqlite3");
const D = new Database(join(ROOT, "node_modules/@mandel59/mojidata/dist/moji.db"), { readonly: true });
const q = (s, ...a) => D.prepare(s).all(...a);
const one = (s, ...a) => D.prepare(s).get(...a);

const kata2hira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const isKata = (s) => /^[゠-ヿ]+$/.test(s);
const fromU = (u) => String.fromCodePoint(parseInt(u.replace("U+", ""), 16));

const radicals = new Map(q("select radical_number n, radical_CJKUI ch from radicals where radical_simplified = 0").map((r) => [r.n, r.ch]));
// 画数は姓名判断と同じ MJ 文字情報（新字体の日本の画数）。Unihan の画数は中国・台湾の字形が先に来るので使わない
const SEIMEI = require("../assets/js/seimei.js");
const strokes = (ch) => { const r = SEIMEI.charStrokes(ch)[0]; return r && r.strokes ? r.strokes : null; };
const radical = (ch) => { const r = one("select value from unihan_each_kRSUnicode where UCS = ? order by i limit 1", ch); if (!r) return null; const n = parseInt(r.value, 10); return { n, ch: radicals.get(n) || "" }; };

const out = new Map();
// 常用漢字
const joyoRows = q("select 漢字 ch, 音訓 r, 例 ex, 備考 note from joyo");
const order = [];
for (const row of joyoRows) {
  if (!out.has(row.ch)) { out.set(row.ch, { ch: row.ch, type: "joyo", readings: [] }); order.push(row.ch); }
  out.get(row.ch).readings.push({ r: row.r, on: isKata(row.r), ex: JSON.parse(row.ex || "[]"), note: row.note || "" });
}
const kangxi = new Map(q("select 漢字 ch, 康熙字典体 old from joyo_kangxi").map((r) => [r.ch, r.old]));
// 人名用漢字（旧字体・異体字は、もとの字のページで紹介する）
const variants = new Map();
for (const r of q("select UCS ch, value from unihan_kJinmeiyoKanji")) {
  const m = r.value.match(/:(U\+[0-9A-F]+)/);
  if (m) { const base = fromU(m[1]); (variants.get(base) || variants.set(base, []).get(base)).push(r.ch); continue; }
  if (out.has(r.ch)) continue;
  const jp = one("select value from unihan_kJapanese where UCS = ?", r.ch);
  const rs = (jp ? jp.value.split(" ") : []).filter(Boolean);
  out.set(r.ch, { ch: r.ch, type: "jinmei", readings: rs.map((x) => ({ r: x, on: isKata(x), ex: [], note: "" })) });
  order.push(r.ch);
}
const list = order.map((ch) => {
  const k = out.get(ch), rad = radical(ch);
  return {
    ch, type: k.type, strokes: strokes(ch), rad: rad ? rad.n : null, radCh: rad ? rad.ch : "",
    old: kangxi.get(ch) || "", jinmeiVariants: variants.get(ch) || [],
    on: [...new Set(k.readings.filter((x) => x.on).map((x) => x.r))],
    kun: [...new Set(k.readings.filter((x) => !x.on).map((x) => x.r))],
    readings: k.readings
  };
});
const bad = list.filter((k) => !k.strokes || !k.rad);
if (bad.length) console.warn("画数・部首なし:", bad.map((k) => k.ch).join(""));
mkdirSync(join(ROOT, "data"), { recursive: true });
writeFileSync(join(ROOT, "data/kanji.json"), JSON.stringify(list));
console.log("kanji", list.length, "joyo", list.filter((k) => k.type === "joyo").length, "jinmei", list.filter((k) => k.type === "jinmei").length,
  "variants", [...variants.values()].flat().length, "kata2hira test", kata2hira("ショウ"));
