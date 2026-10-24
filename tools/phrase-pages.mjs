// 四字熟語・ことわざのページ：yoji/・yoji/<熟語>/・kotowaza/・kotowaza/<ことわざ>/
import yojiData from "../data/yoji.mjs";
import kotoData from "../data/kotowaza.mjs";
import YURAI from "../data/yurai.mjs";

const GYO = [["あ", "あいうえお"], ["か", "かきくけこがぎぐげご"], ["さ", "さしすせそざじずぜぞ"], ["た", "たちつてとだぢづでど"], ["な", "なにぬねの"], ["は", "はひふへほばびぶべぼぱぴぷぺぽ"], ["ま", "まみむめも"], ["や", "やゆよ"], ["ら", "らりるれろ"], ["わ", "わを"]];
const gyoOf = (r) => (GYO.find(([, cs]) => cs.includes(r[0])) || ["他"])[0];
const KINDS = {
  yoji: { dir: "yoji", name: "四字熟語", data: yojiData },
  kotowaza: { dir: "kotowaza", name: "ことわざ", data: kotoData }
};

/** 漢字 → それを使う四字熟語・ことわざ（漢字のページで使う） */
export function phrasesByChar() {
  const m = new Map();
  for (const kind of Object.values(KINDS)) for (const [w, y] of kind.data)
    for (const c of new Set(Array.from(w).filter((c) => /\p{Script=Han}/u.test(c)))) (m.get(c) || m.set(c, []).get(c)).push({ w, y, dir: kind.dir, kind: kind.name });
  return m;
}

export function buildPhrases({ page, write, esc, kanjiSet }) {
  const urls = [];
  for (const kind of Object.values(KINDS)) {
    const list = kind.data.map(([w, y, mean, ex, rel]) => ({ w, y, mean, ex, rel })).sort((a, b) => a.y.localeCompare(b.y, "ja"));
    const names = new Set(list.map((x) => x.w));
    list.forEach((x, i) => {
      const chars = [...new Set(Array.from(x.w).filter((c) => kanjiSet.has(c)))];
      const near = [1, 2, 3, 4, -1, -2, -3, -4].map((d) => list[(i + d + list.length) % list.length]).filter((v, j, a) => v !== x && a.indexOf(v) === j);
      const desc = `「${x.w}」（${x.y}）の意味は「${x.mean.replace(/。$/, "")}」。${YURAI[x.w] ? "由来と" : ""}使い方の例文${x.rel ? "、似た意味の言葉" : ""}、使われている漢字も紹介します。`;
      const body = `<p class="yomi">${esc(x.y)}</p>
<section class="sec prose" aria-labelledby="m"><h2 id="m">「${esc(x.w)}」の意味</h2><p class="pmean">${esc(x.mean)}</p></section>
${YURAI[x.w] ? `<section class="sec prose" aria-labelledby="o2"><h2 id="o2">「${esc(x.w)}」の由来</h2><p class="porigin">${esc(YURAI[x.w])}</p></section>` : ""}
<section class="sec prose" aria-labelledby="e"><h2 id="e">使い方・例文</h2><p class="pex">${esc(x.ex)}</p></section>
${x.rel ? `<section class="sec prose" aria-labelledby="r"><h2 id="r">似た意味の${kind.name}</h2><p>${names.has(x.rel) ? `<a href="../${x.rel}/">${esc(x.rel)}</a>` : esc(x.rel)}</p></section>` : ""}
${chars.length ? `<section class="sec" aria-labelledby="k"><h2 id="k">使われている漢字</h2><ul class="kchips">${chars.map((c) => `<li><a href="../../kanji/${c}/">${esc(c)}</a></li>`).join("")}</ul><p class="note">字をえらぶと、読み方・画数・名前に使えるかがわかります。</p></section>` : ""}
<section class="sec" aria-labelledby="o"><h2 id="o">ほかの${kind.name}</h2><ul class="plist">${near.map((n) => `<li><a href="../${n.w}/"><b>${esc(n.w)}</b><small>${esc(n.y)}</small></a></li>`).join("")}</ul>
<p><a href="../">${kind.name}の一覧（${list.length}）→</a></p></section>`;
      write(`${kind.dir}/${x.w}`, page({ path: `${kind.dir}/${x.w}/`, title: YURAI[x.w] ? `「${x.w}」の意味・由来・使い方｜${kind.name}` : `「${x.w}」の意味・読み方・使い方｜${kind.name}`, h1: `${esc(x.w)}`, desc,
        crumbs: [{ name: kind.name, path: `${kind.dir}/` }, { name: x.w, path: `${kind.dir}/${x.w}/` }], body }));
      urls.push(`${kind.dir}/${x.w}/`);
    });
    const body = `<p class="lead">よく使われる${kind.name}${list.length}の意味と使い方を、例文つきで紹介します。</p>
<nav class="era-nav" aria-label="五十音">${GYO.filter(([g]) => list.some((x) => gyoOf(x.y) === g)).map(([g]) => `<a href="#g-${g}">${g}行</a>`).join("")}</nav>
${GYO.map(([g]) => { const xs = list.filter((x) => gyoOf(x.y) === g); return xs.length ? `<section class="sec" aria-labelledby="g-${g}"><h2 id="g-${g}">${g}行</h2><ul class="plist is-long">${xs.map((x) => `<li><a href="${x.w}/"><b>${esc(x.w)}</b><small>${esc(x.y)}</small><span>${esc(x.mean)}</span></a></li>`).join("")}</ul></section>` : ""; }).join("\n")}`;
    write(kind.dir, page({ path: `${kind.dir}/`, title: `${kind.name}一覧｜意味と使い方・例文`, h1: `${kind.name}の意味と使い方`,
      desc: `よく使われる${kind.name}${list.length}の一覧。意味・読み方・例文を五十音順で紹介します。`, crumbs: [{ name: kind.name, path: `${kind.dir}/` }], body }));
    urls.unshift(`${kind.dir}/`);
  }
  return { urls };
}
