// 赤ちゃんの名前：読みごとのページ（/akachan/yomi/<読み>/）
//   「はると 漢字」「ひまり 名前 姓名判断」などで探す人向け。読みごとに、よく使われる漢字の組み合わせと画数・字の意味をまとめる。
//   名字を入れると、その場で姓名判断の評価（💮◎〇△）を出す（assets/js/yomi-page.js）。
const G = { m: "男の子", f: "女の子", u: "男女どちらも" };
const GYO = [["あ", "あいうえお"], ["か", "かきくけこがぎぐげご"], ["さ", "さしすせそざじずぜぞ"], ["た", "たちつてとだぢづでど"], ["な", "なにぬねの"], ["は", "はひふへほばびぶべぼぱぴぷぺぽ"], ["ま", "まみむめも"], ["や", "やゆよ"], ["ら", "らりるれろ"], ["わ", "わを"]];
const gyoOf = (r) => (GYO.find(([, cs]) => cs.includes(r[0])) || ["他"])[0];

export function buildAkachanYomi({ page, write, esc, S, IMI, NAMES, kanjiSet }) {
  const by = new Map();
  for (const n of NAMES) {
    const o = by.get(n.yomi) || by.set(n.yomi, { yomi: n.yomi, g: new Set(), list: [] }).get(n.yomi);
    o.g.add(n.g);
    if (!o.list.includes(n.mei)) o.list.push(n.mei);
  }
  const all = [...by.values()].sort((a, b) => a.yomi.localeCompare(b.yomi, "ja"));
  const gLabel = (o) => o.g.has("u") || (o.g.has("m") && o.g.has("f")) ? G.u : o.g.has("m") ? G.m : G.f;
  const urls = [];
  all.forEach((o, i) => {
    const up = "../../../";
    const rows = o.list.map((mei) => {
      const cs = S.charStrokes(mei);
      const total = cs.reduce((a, c) => a + (c.strokes || 0), 0);
      const imi = cs.map((c) => IMI[c.ch] ? `${c.ch}：${IMI[c.ch][0]}` : "").filter(Boolean).join("　");
      const chars = cs.map((c) => kanjiSet.has(c.ch) ? `<a href="${up}kanji/${c.ch}/">${esc(c.ch)}</a><small>${c.strokes}</small>` : `${esc(c.ch)}<small>${c.strokes}</small>`).join("");
      return `<tr data-mei="${esc(mei)}"><th scope="row"><span class="yn-name">${esc(mei)}</span></th><td class="yn-chars">${chars}</td><td>${total}画</td><td class="yn-mark" aria-live="polite"></td><td class="yn-imi">${esc(imi) || "—"}</td></tr>`;
    }).join("");
    const near = all.filter((x) => x !== o && x.yomi[0] === o.yomi[0]).slice(0, 12);
    const label = gLabel(o);
    const body = `<p class="yomi">${esc(label)}の名前</p>
<p class="lead">「${esc(o.yomi)}」と読む名前の、よく使われる漢字の組み合わせを${o.list.length}通り集めました。名字を入れると、それぞれの名前の姓名判断の評価（💮◎〇△）がわかります。</p>
<section class="sec sec-form" aria-labelledby="ys">
<h2 id="ys">名字と合わせて姓名判断</h2>
<form id="yn-form" class="form yn-form" novalidate>
<div class="field"><label for="yn-sei">名字</label><input id="yn-sei" name="sei" maxlength="6" autocomplete="family-name" placeholder="例：佐藤"></div>
<button class="btn" type="submit">評価を見る</button>
</form>
<p id="yn-err" class="err" role="alert" hidden></p>
<p class="note">入れた名字は、この画面の中だけで計算します。どこにも送りません。</p>
</section>
<section class="sec" aria-labelledby="yl">
<h2 id="yl">「${esc(o.yomi)}」の漢字の組み合わせ</h2>
<div class="yn-wrap"><table class="ktable yn-table"><thead><tr><th scope="col">名前</th><th scope="col">字と画数</th><th scope="col">名の画数</th><th scope="col">評価</th><th scope="col">字の意味</th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="note">名前の読み方は、常識の範囲で自由に決められます。ここにあるのは、よく見られる組み合わせの例です。字をえらぶと、読み方や意味がわかります。</p>
</section>
<section class="sec" aria-labelledby="yh"><h2 id="yh">「${esc(o.yomi)}」の名前をえらぶヒント</h2>
<div class="prose"><p>同じ「${esc(o.yomi)}」でも、使う漢字で印象と画数が変わります。名字と合わせたときの五格（人格・総格など）は名字によって変わるので、上の欄に名字を入れてくらべてみてください。</p>
<p>気になる名前は、<a href="${up}akachan/">赤ちゃんの名前さがし</a>で♥を押すと<a href="${up}nazuke/">名づけ候補くらべ</a>に保存できます。</p></div></section>
${near.length ? `<section class="sec" aria-labelledby="yo"><h2 id="yo">「${esc(o.yomi[0])}」ではじまるほかの名前</h2><ul class="kchips is-wide">${near.map((x) => `<li><a href="../${x.yomi}/">${esc(x.yomi)}</a></li>`).join("")}</ul></section>` : ""}`;
    write(`akachan/yomi/${o.yomi}`, page({ path: `akachan/yomi/${o.yomi}/`, title: `「${o.yomi}」の名前の漢字一覧と姓名判断｜${label}の名づけ｜なまえ帖`, h1: `「${esc(o.yomi)}」の名前と漢字`,
      desc: `「${o.yomi}」と読む${label}の名前の漢字${o.list.length}通り（${o.list.slice(0, 5).join("・")}など）。画数と字の意味、名字と合わせた姓名判断の評価がわかります。`,
      crumbs: [{ name: "赤ちゃんの名前さがし", path: "akachan/" }, { name: `「${o.yomi}」の名前`, path: `akachan/yomi/${o.yomi}/` }],
      scripts: ["seimei-strokes.js", "seimei.js", "luck.js", "core.js", "yomi-page.js"], body }));
    urls.push(`akachan/yomi/${o.yomi}/`);
  });
  const block = (g) => {
    const xs = all.filter((o) => gLabel(o) === g);
    return GYO.map(([k]) => { const ys = xs.filter((o) => gyoOf(o.yomi) === k); return ys.length ? `<h3>${k}行</h3><ul class="kchips is-wide">${ys.map((o) => `<li><a href="yomi/${o.yomi}/">${esc(o.yomi)}<small>${o.list.length}</small></a></li>`).join("")}</ul>` : ""; }).join("");
  };
  const indexHtml = `<section class="sec" aria-labelledby="ay-m"><h2 id="ay-m">男の子の名前を読みからさがす</h2>${block(G.m)}</section>
<section class="sec" aria-labelledby="ay-f"><h2 id="ay-f">女の子の名前を読みからさがす</h2>${block(G.f)}</section>
<section class="sec" aria-labelledby="ay-u"><h2 id="ay-u">男女どちらにも使える名前</h2>${block(G.u)}</section>`;
  return { urls, indexHtml, count: all.length };
}
