// 名字のページ：myoji/（さくいん）／myoji/<名字>/
//   「佐藤 姓名判断」「佐藤 名前 合う」「東海林 読み方」などで探す人向け。
//   名字ごとに、読み方・字の画数と、その名字と合わせたときに姓名判断の評価がよい名前（男の子・女の子）を、ここで計算して書きこむ。
//   人数・順位は確かめられないので載せない。
import MYOJI from "../data/myoji.mjs";

const GYO = [["あ", "あいうえお"], ["か", "かきくけこがぎぐげご"], ["さ", "さしすせそざじずぜぞ"], ["た", "たちつてとだぢづでど"], ["な", "なにぬねの"], ["は", "はひふへほばびぶべぼぱぴぷぺぽ"], ["ま", "まみむめも"], ["や", "やゆよ"], ["ら", "らりるれろ"], ["わ", "わを"]];
const gyoOf = (r) => (GYO.find(([, cs]) => cs.includes(r[0])) || ["他"])[0];
const RANK = { hanamaru: 0, nijuumaru: 1, maru: 2, sankaku: 3 };

export function buildMyoji({ page, write, esc, S, C, L, NAMES, kanjiSet }) {
  const list = MYOJI.map((m) => {
    const cs = S.charStrokes(m.sei);
    return { ...m, cs, strokes: cs.map((c) => c.strokes), ten: cs.reduce((a, c) => a + c.strokes, 0) };
  });
  const byYomi = new Map(), byPattern = new Map();
  for (const m of list) {
    for (const y of m.yomi) (byYomi.get(y) || byYomi.set(y, []).get(y)).push(m);
    const k = m.strokes.join("-");
    (byPattern.get(k) || byPattern.set(k, []).get(k)).push(m);
  }
  const urls = [];

  for (const m of list) {
    const up = "../../";
    const y = m.yomi[0], yAll = m.yomi.join("・");
    // その名字と合わせた名前の評価（評価のよい順）
    const scored = NAMES.map((n) => {
      const r = S.calculateSeimei({ sei: m.sei, mei: n.mei });
      return r.ok ? { n, r, rt: C.rate(r) } : null;
    }).filter(Boolean).sort((a, b) => RANK[a.rt.mark.key] - RANK[b.rt.mark.key] || b.rt.score - a.rt.score || a.n.yomi.localeCompare(b.n.yomi, "ja"));
    const pick = (g, max) => {
      const out = [], seen = new Set();
      for (const x of scored) {
        if (x.n.g !== g && x.n.g !== "u") continue;
        if (seen.has(x.n.mei)) continue;
        seen.add(x.n.mei); out.push(x);
        if (out.length >= max) break;
      }
      return out;
    };
    const row = (x) => `<tr><td class="mark">${x.rt.mark.mark}</td><th scope="row"><a href="${up}akachan/yomi/${x.n.yomi}/">${esc(x.n.mei)}</a><small>${esc(x.n.yomi)}</small></th><td>${x.r.jin.value}画<small>${esc(x.r.jin.luck)}</small></td><td>${x.r.sou.value}画<small>${esc(x.r.sou.luck)}</small></td></tr>`;
    const table = (xs) => `<div class="yn-wrap"><table class="ktable my-table"><thead><tr><th scope="col">評価</th><th scope="col">名前</th><th scope="col">人格</th><th scope="col">総格</th></tr></thead><tbody>${xs.map(row).join("")}</tbody></table></div>`;
    const boys = pick("m", 20), girls = pick("f", 20);
    const best = scored.filter((x) => x.rt.mark.key === "hanamaru");
    // 評価のよい名前の「名の画数」の組み合わせ（例つき）
    const pat = new Map();
    for (const x of best) {
      const k = S.charStrokes(x.n.mei).map((c) => c.strokes).join("＋");
      const e = pat.get(k) || pat.set(k, { k, n: Array.from(x.n.mei).length, ex: [] }).get(k);
      if (e.ex.length < 3 && !e.ex.includes(x.n.mei)) e.ex.push(x.n.mei);
    }
    const pats = [...pat.values()].sort((a, b) => b.ex.length - a.ex.length || a.n - b.n).slice(0, 8);
    const same = (byYomi.get(y) || []).filter((o) => o !== m);
    const twin = (byPattern.get(m.strokes.join("-")) || []).filter((o) => o !== m);
    const tl = L.of(m.ten);
    const charRows = m.cs.map((c) => `<tr><th scope="row">${kanjiSet.has(c.ch) ? `<a href="${up}kanji/${c.ch}/">${esc(c.ch)}</a>` : esc(c.ch)}</th><td>${c.strokes}画</td></tr>`).join("");
    const body = `<p class="yomi">${esc(yAll)}</p>
<p class="lead">「${esc(m.sei)}」の読み方は「${esc(yAll)}」。${m.cs.map((c) => `${esc(c.ch)}（${c.strokes}画）`).join("＋")}で、名字の画数（天格）は${m.ten}画です。${esc(m.sei)}さんの赤ちゃんに合う名前を、姓名判断の評価がよい順に紹介します。</p>
<section class="sec" aria-labelledby="mk"><h2 id="mk">「${esc(m.sei)}」の読み方と画数</h2>
<dl class="kinfo"><div><dt>読み方</dt><dd>${esc(yAll)}</dd></div><div><dt>画数</dt><dd>${m.ten}画</dd></div><div><dt>天格</dt><dd><a href="${up}kazu/${m.ten}/">${m.ten}画（${esc(tl.luck)}）</a></dd></div></dl>
<table class="ktable"><thead><tr><th scope="col">字</th><th scope="col">画数</th></tr></thead><tbody>${charRows}</tbody></table>
<p class="note">画数は新字体で数えています（旧字体で数える流派では、字によって画数が変わります）。天格は家系から受けつぐ数なので、吉凶は重く見ません。</p></section>
<section class="sec" aria-labelledby="mb"><h2 id="mb">${esc(m.sei)}さんに合う男の子の名前</h2>${table(boys)}</section>
<section class="sec" aria-labelledby="mg"><h2 id="mg">${esc(m.sei)}さんに合う女の子の名前</h2>${table(girls)}</section>
${pats.length ? `<section class="sec" aria-labelledby="mp"><h2 id="mp">${esc(m.sei)}さんと相性のよい名前の画数</h2>
<p>「${esc(m.sei)}」と合わせたとき、評価が💮になる名前の画数の組み合わせです。名前の1字目・2字目の画数を、この組み合わせに近づけると、よい評価になりやすくなります。</p>
<ul class="my-pat">${pats.map((p) => `<li><b>${esc(p.k)}画</b><span>例：${p.ex.map(esc).join("・")}</span></li>`).join("")}</ul></section>` : ""}
<section class="sec sec-form" aria-labelledby="ma"><h2 id="ma">ほかの名前もしらべる</h2>
<p>ここにない名前も、名字と合わせて評価を見られます。候補をたくさん見たいときは名前さがし、決めた名前をくわしく見たいときは姓名判断へ。</p>
<p class="cta-row"><a class="btn" href="${up}akachan/">${esc(m.sei)}さんの名前を評価順にさがす</a> <a class="btn btn-sub" href="${up}">名前を入れて姓名判断</a></p>
<p class="note">名字は「${esc(m.sei)}」と入れてください。入れた名前はどこにも送りません。</p></section>
${same.length ? `<section class="sec" aria-labelledby="ms"><h2 id="ms">「${esc(y)}」と読むほかの名字</h2><ul class="kchips is-wide">${same.map((o) => `<li><a href="../${o.sei}/">${esc(o.sei)}<small>${o.ten}画</small></a></li>`).join("")}</ul>
<p class="note">同じ読みでも字がちがうと画数が変わり、合う名前も変わります。</p></section>` : ""}
${twin.length ? `<section class="sec" aria-labelledby="mt"><h2 id="mt">画数の組み合わせが同じ名字</h2><p>${m.strokes.join("画＋")}画の名字です。姓名判断の結果は「${esc(m.sei)}」と同じになります。</p><ul class="kchips is-wide">${twin.slice(0, 20).map((o) => `<li><a href="../${o.sei}/">${esc(o.sei)}</a></li>`).join("")}</ul></section>` : ""}
<p><a href="../">名字の一覧（${list.length}）→</a></p>`;
    write(`myoji/${m.sei}`, page({
      path: `myoji/${m.sei}/`,
      title: `${m.sei}（${y}）の読み方・画数と姓名判断｜${m.sei}さんに合う名前【男の子・女の子】`,
      h1: `${esc(m.sei)}さんの姓名判断と合う名前`,
      desc: `「${m.sei}」の読み方は「${yAll}」、画数は${m.ten}画。${m.sei}さんと合わせて姓名判断の評価がよい男の子・女の子の名前（${[boys[0], girls[0]].filter(Boolean).map((x) => x.n.mei).join("・")}など）と、相性のよい名前の画数を紹介します。`,
      crumbs: [{ name: "名字の一覧", path: "myoji/" }, { name: m.sei, path: `myoji/${m.sei}/` }], body }));
    urls.push(`myoji/${m.sei}/`);
  }

  const sorted = [...list].sort((a, b) => a.yomi[0].localeCompare(b.yomi[0], "ja"));
  const body = `<p class="lead">名字ごとに、読み方と画数、その名字と合わせて姓名判断の評価がよい名前（男の子・女の子）をまとめました。名字をえらんでください。</p>
<nav class="era-nav" aria-label="五十音">${GYO.filter(([g]) => sorted.some((m) => gyoOf(m.yomi[0]) === g)).map(([g]) => `<a href="#g-${g}">${g}行</a>`).join("")}</nav>
${GYO.map(([g]) => { const xs = sorted.filter((m) => gyoOf(m.yomi[0]) === g); return xs.length ? `<section class="sec" aria-labelledby="g-${g}"><h2 id="g-${g}">${g}行</h2><ul class="kchips is-wide">${xs.map((m) => `<li><a href="${m.sei}/">${esc(m.sei)}<small>${esc(m.yomi[0])}</small></a></li>`).join("")}</ul></section>` : ""; }).join("\n")}
<p class="note">ここにない名字でも、<a href="../akachan/">赤ちゃんの名前さがし</a>や<a href="../">姓名判断</a>で、名字を入れて調べられます。人数や順位は載せていません。</p>`;
  write("myoji", page({ path: "myoji/", title: `名字の読み方・画数と姓名判断【${list.length}】名字に合う赤ちゃんの名前`, h1: "名字から姓名判断",
    desc: `${list.length}の名字の読み方と画数、その名字と合わせて姓名判断の評価がよい男の子・女の子の名前を紹介します。五十音順でさがせます。`,
    crumbs: [{ name: "名字の一覧", path: "myoji/" }], body }));
  urls.unshift("myoji/");
  return { urls, count: list.length };
}
