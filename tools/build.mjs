// なまえ帖（仮）のページを作る：node tools/build.mjs
//   index.html（TOP・姓名判断）／ijin/（偉人の一覧）／ijin/<slug>/（偉人ごとの姓名判断）／about/／privacy/／sitemap.xml／robots.txt
//   偉人のページの結果は、ここで計算して HTML に書きこむ（検索エンジンにも中身が見えるように）。
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildKanji } from "./kanji-pages.mjs";
import { buildPhrases, phrasesByChar } from "./phrase-pages.mjs";

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const S = require("../assets/js/seimei.js");
const C = require("../assets/js/core.js");
const L = require("../assets/js/luck.js");
const { LIST, ERAS, FIELDS } = require("../assets/js/ijin.js");
const CONF = JSON.parse(readFileSync(join(ROOT, "site.config.json"), "utf8"));
const SITE = CONF.name, BASE = CONF.baseUrl.replace(/\/$/, "");

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const NAME = { ten: "天格", jin: "人格", chi: "地格", gai: "外格", sou: "総格" };
const ROLE = {
  ten: "家系から受けつぐ運。自分では変えにくいので、吉凶は重く見ません。",
  jin: "性格の中心と、仕事の運。五格の中でいちばん大切な数です。",
  chi: "子どものころから若いころの運と、家族や身近な人との縁。",
  gai: "まわりの人との関係や、外から受ける助け。",
  sou: "人生全体の流れと、年を重ねてからの運。"
};
const ORDER = ["jin", "sou", "chi", "gai", "ten"];
const years = (p) => (p.born ? p.born + "年" : "生年不詳") + "〜" + p.died + "年";
const people = LIST.map((p) => {
  const r = S.calculateSeimei({ sei: p.sei, mei: p.mei });
  if (!r.ok) throw new Error("画数がわからない字: " + p.sei + p.mei);
  return { ...p, r, rt: C.rate(r) };
});

function page({ path, title, desc, body, h1, crumbs = [], scripts = [], jsonld = [] }) {
  const depth = path === "" ? 0 : path.split("/").filter(Boolean).length;
  const up = "../".repeat(depth);
  const url = BASE + "/" + encodeURI(path);
  const bc = [{ name: "トップ", url: BASE + "/" }].concat(crumbs.map((c) => ({ name: c.name, url: BASE + "/" + c.path })));
  const ld = jsonld.concat(crumbs.length ? [{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: bc.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, item: encodeURI(b.url) })) }] : []);
  const nav = [["", "姓名判断"], ["kanji/", "漢字"], ["yoji/", "四字熟語"], ["kotowaza/", "ことわざ"], ["ijin/", "偉人"]];
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="${depth ? "article" : "website"}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="${esc(SITE)}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#1b2a4a">
<link rel="stylesheet" href="${up}assets/css/site.css">
${ld.map((x) => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join("\n")}
</head>
<body>
<a class="skip" href="#main">本文へ</a>
<header class="hd"><div class="wrap">
<a class="logo" href="${up || "./"}"><span>名</span>${esc(SITE)}</a>
<nav class="nav" aria-label="メニュー">${nav.map(([p, n]) => `<a href="${up}${p}"${p === path ? ' aria-current="page"' : ""}>${n}</a>`).join("")}</nav>
</div></header>
<main id="main" class="wrap">
${crumbs.length ? `<nav class="crumb" aria-label="パンくず"><ol>${bc.map((b, i) => i === bc.length - 1 ? `<li aria-current="page">${esc(b.name)}</li>` : `<li><a href="${up}${i ? crumbs[i - 1].path : ""}">${esc(b.name)}</a></li>`).join("")}</ol></nav>` : ""}
<h1>${h1 || esc(title)}</h1>
${body}
</main>
<footer class="ft"><div class="wrap">
<ul><li><a href="${up}">姓名判断</a></li><li><a href="${up}kanji/">漢字辞典</a></li><li><a href="${up}yoji/">四字熟語</a></li><li><a href="${up}kotowaza/">ことわざ</a></li><li><a href="${up}ijin/">偉人の名前</a></li><li><a href="${up}about/">このサイトについて</a></li><li><a href="${up}privacy/">プライバシーポリシー</a></li></ul>
<p>画数データの一部に、文字情報基盤（MJ文字情報一覧表、独立行政法人情報処理推進機構）を使っています（CC BY-SA 2.1 JP）。漢字の読みと例は文化庁「常用漢字表」、人名用漢字の一覧と読み・部首は Unicode Unihan Database（Unicode License v3）によります。</p>
<p>&copy; ${esc(SITE)}</p>
</div></footer>
${scripts.map((s) => `<script src="${up}assets/js/${s}" defer></script>`).join("\n")}
</body>
</html>
`;
}

const write = (path, html) => {
  const file = join(ROOT, path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
};

const charsHtml = (r) => `<div class="chars" aria-label="名前の字と画数">${r.sei.map((c) => `<div class="char"><b>${esc(c.ch)}</b><span>${c.strokes}画</span></div>`).join("")}<div class="char is-sep" aria-hidden="true"></div>${r.mei.map((c) => `<div class="char"><b>${esc(c.ch)}</b><span>${c.strokes}画</span></div>`).join("")}</div>`;
const kakuHtml = (r) => `<ul class="kaku">${ORDER.map((k) => { const l = L.of(r[k].value); return `<li><b>${NAME[k]}</b><span class="n">${r[k].value}画</span><span class="luck l-${l.luck}">${l.luck}</span><small>${esc(l.keyword)}</small><span class="role">${ROLE[k]}</span></li>`; }).join("")}</ul>`;
const personLink = (p) => `<li><a href="../${p.slug}/"><span class="nm">${esc(p.sei + p.mei)}</span><span class="sub">${esc(p.era)}・${esc(p.fieldName)}</span><span class="mk" aria-label="評価：${esc(p.rt.mark.label)}">${p.rt.mark.mark}</span></a></li>`;

// ---- 偉人ごとのページ ----
for (const p of people) {
  const { r, rt } = p, full = p.sei + p.mei, s = r.sansai;
  const jin = L.of(r.jin.value), sou = L.of(r.sou.value);
  const sameJin = people.filter((q) => q !== p && q.r.jin.value === r.jin.value);
  const sameSou = people.filter((q) => q !== p && q.r.sou.value === r.sou.value && !sameJin.includes(q));
  const sameEra = people.filter((q) => q !== p && q.era === p.era).slice(0, 6);
  const goNote = p.go ? `<p class="note">${esc(full)}は号・筆名など、広く知られている名前で見ています。本名で見ると結果が変わります。</p>` : "";
  const desc = `${full}（${p.seiYomi} ${p.meiYomi}）の名前を姓名判断。人格${r.jin.value}画（${jin.luck}）・総格${r.sou.value}画（${sou.luck}）、評価は「${rt.mark.mark} ${rt.mark.label}」。五格と三才配置、同じ画数の偉人も紹介します。`;
  const body = `<p class="yomi">${esc(p.seiYomi)} ${esc(p.meiYomi)}／${esc(years(p))}／${esc(p.era)}・${esc(p.fieldName)}</p>
<p class="lead">${esc(p.about)}</p>
<section class="sec" aria-labelledby="v">
<div class="verdict"><div class="seal" role="img" aria-label="評価：${esc(rt.mark.label)}">${rt.mark.mark}</div>
<div><h2 id="v">${esc(full)}の名前は「${esc(rt.mark.label)}」</h2><p>${esc(rt.mark.text)}</p></div></div>
${charsHtml(r)}${goNote}
</section>
<section class="sec" aria-labelledby="k">
<h2 id="k">${esc(full)}の五格</h2>
${kakuHtml(r)}
<div class="prose">
<h3>人格${r.jin.value}画「${esc(jin.keyword)}」</h3>
<p>性格の中心をあらわす人格は${r.jin.value}画で、${jin.luck}数です。${esc(full)}の名前では、「${esc(jin.keyword)}」が名前の芯になっています。</p>
<h3>総格${r.sou.value}画「${esc(sou.keyword)}」</h3>
<p>名前全体の画数である総格は${r.sou.value}画で、${sou.luck}数です。人生全体の流れには「${esc(sou.keyword)}」の意味があるとされます。</p>
<h3>三才配置</h3>
<p>天格・人格・地格の五行は ${s.ten}→${s.jin}→${s.chi}。天と人は「${s.tenJin.type}」、人と地は「${s.jinChi.type}」の関係です。</p>
</div>
<p class="note">画数は新字体で数えています。姓名判断は名前を考えるための目安で、その人の生き方や功績を評価するものではありません。</p>
</section>
${sameJin.length || sameSou.length ? `<section class="sec" aria-labelledby="same">
<h2 id="same">${esc(full)}と同じ画数の偉人</h2>
${sameJin.length ? `<h3>人格が同じ${r.jin.value}画</h3><ul class="people">${sameJin.map(personLink).join("")}</ul>` : ""}
${sameSou.length ? `<h3>総格が同じ${r.sou.value}画</h3><ul class="people">${sameSou.map(personLink).join("")}</ul>` : ""}
</section>` : ""}
<section class="sec" aria-labelledby="me">
<h2 id="me">あなたの名前は${esc(full)}に似ている？</h2>
<p>名前を入れると、評価（💮◎〇△）と五格、画数の型が似ている偉人がわかります。</p>
<p><a class="btn" href="../../">自分の名前で姓名判断する</a></p>
</section>
${sameEra.length ? `<section class="sec" aria-labelledby="era"><h2 id="era">${esc(p.era)}の偉人</h2><ul class="people">${sameEra.map(personLink).join("")}</ul></section>` : ""}`;
  write(`ijin/${p.slug}`, page({
    path: `ijin/${p.slug}/`, title: `${full}の姓名判断｜画数と五格・名前の評価｜${SITE}`, h1: `${esc(full)}の姓名判断`, desc,
    crumbs: [{ name: "偉人の名前", path: "ijin/" }, { name: full, path: `ijin/${p.slug}/` }], body
  }));
}

// ---- 偉人の一覧 ----
{
  const count = (m) => people.filter((p) => p.rt.mark.mark === m).length;
  const body = `<p class="lead">歴史に名を残した${people.length}人の名前を、姓名判断で見てみました。名前をえらぶと、画数と五格、評価（💮◎〇△）がわかります。</p>
<nav class="era-nav" aria-label="時代">${ERAS.filter((e) => people.some((p) => p.era === e)).map((e, i) => `<a href="#era-${i}">${esc(e)}</a>`).join("")}</nav>
${ERAS.map((e, i) => { const ps = people.filter((p) => p.era === e); return ps.length ? `<section class="sec" aria-labelledby="era-${i}"><h2 id="era-${i}">${esc(e)}</h2><ul class="people">${ps.map((p) => personLink(p).replace('href="../', 'href="')).join("")}</ul></section>` : ""; }).join("\n")}
<section class="sec" aria-labelledby="sum"><h2 id="sum">評価のわりあい</h2>
<ul class="marks">${C.MARKS.map((m) => `<li><b>${m.mark}</b><span>${m.label}：${count(m.mark)}人</span></li>`).join("")}</ul>
<p class="note">載せているのは歴史上の人物だけです。号・筆名で広く知られる人は、その名前で見ています。</p></section>`;
  write("ijin", page({ path: "ijin/", title: `偉人の姓名判断｜歴史上の人物${people.length}人の画数と評価｜${SITE}`, h1: "偉人の名前を姓名判断",
    desc: `坂本龍馬・織田信長・夏目漱石など、歴史上の人物${people.length}人の名前を姓名判断。画数と五格、💮◎〇△の評価を時代別に紹介します。`,
    crumbs: [{ name: "偉人の名前", path: "ijin/" }], body }));
}

// ---- TOP ----
{
  const pick = ["sakamoto-ryoma", "oda-nobunaga", "natsume-soseki", "noguchi-hideyo", "tokugawa-ieyasu", "sugawara-no-michizane", "miyazawa-kenji", "fukuzawa-yukichi"]
    .map((s) => people.find((p) => p.slug === s)).filter(Boolean);
  const body = `<p class="lead">姓と名を入れるだけ。名前の画数から五格を出して、<b>💮◎〇△</b>の4段階で評価します。あなたの名前に似ている偉人も見つかります。</p>
<section class="sec" aria-labelledby="f">
<h2 id="f">名前を入れてください</h2>
<form id="name-form" class="form" novalidate>
<div class="form-row">
<div class="field"><label for="sei">姓</label><input id="sei" name="sei" autocomplete="family-name" maxlength="10" placeholder="例：佐藤" required></div>
<div class="field"><label for="mei">名</label><input id="mei" name="mei" autocomplete="given-name" maxlength="10" placeholder="例：太郎" required></div>
</div>
<p id="name-err" class="err" role="alert" hidden></p>
<button class="btn" type="submit">姓名判断をする</button>
<p class="note">入力した名前は、この画面の中だけで計算します。どこにも送ったり保存したりしません。</p>
</form>
</section>
<div id="result" aria-live="polite" hidden></div>
<section class="sec" aria-labelledby="m">
<h2 id="m">評価の見方</h2>
<ul class="marks">${C.MARKS.map((m) => `<li><b>${m.mark}</b><span><strong>${m.label}</strong>：${esc(m.text)}</span></li>`).join("")}</ul>
<p class="note">人格35％・総格30％・地格15％・外格10％・三才配置10％の重みで、五格の吉凶をまとめています。天格は家系の数なので評価に入れていません。</p>
</section>
<section class="sec" aria-labelledby="p">
<h2 id="p">偉人の名前を姓名判断</h2>
<ul class="people">${pick.map((p) => personLink(p).replace('href="../', 'href="ijin/')).join("")}</ul>
<p><a href="ijin/">${people.length}人の偉人をすべて見る →</a></p>
</section>
<section class="sec" aria-labelledby="d">
<h2 id="d">漢字・四字熟語・ことわざを調べる</h2>
<ul class="plist">
<li><a href="kanji/"><b>漢字辞典</b><span>名前に使える漢字の読み方・画数・部首。画数別・読み別の一覧も。</span></a></li>
<li><a href="yoji/"><b>四字熟語</b><span>よく使う四字熟語の意味と使い方を例文つきで。</span></a></li>
<li><a href="kotowaza/"><b>ことわざ</b><span>よく使うことわざの意味と使い方を例文つきで。</span></a></li>
</ul>
</section>
<section class="sec prose" aria-labelledby="h">
<h2 id="h">姓名判断のしくみ</h2>
<p>姓名判断では、名前の文字の画数から「五格」とよばれる5つの数を出します。姓の合計が天格、姓の最後と名の最初の字の合計が人格、名の合計が地格、全部の合計が総格、総格から人格を引いた数が外格です。</p>
<p>それぞれの数には吉凶とキーワードがあり、とくに人格（性格の中心）と総格（人生全体）が大切だと考えられています。このサイトでは画数を新字体で数えています。旧字体で数える流派では、結果が変わることがあります。</p>
</section>`;
  write("", page({ path: "", title: `姓名判断｜名前を💮◎〇△で評価・似ている偉人もわかる｜${SITE}`, h1: "名前の姓名判断",
    desc: "姓と名を入れるだけで、名前の画数から五格（天格・人格・地格・外格・総格）を出して、💮◎〇△の4段階で評価します。画数の型が似ている偉人もわかります。",
    scripts: ["seimei-strokes.js", "seimei.js", "luck.js", "ijin.js", "core.js", "app.js"],
    jsonld: [{ "@context": "https://schema.org", "@type": "WebApplication", name: SITE + " 姓名判断", url: BASE + "/", applicationCategory: "LifestyleApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" } }],
    body }));
}

// ---- このサイトについて・プライバシー ----
write("about", page({ path: "about/", title: `このサイトについて｜${SITE}`, desc: `${SITE}の姓名判断の計算方法と、使っているデータについて。`, crumbs: [{ name: "このサイトについて", path: "about/" }],
  body: `<section class="sec prose"><h2>${esc(SITE)}とは</h2>
<p>名前と漢字のことを、楽しく調べられるサイトです。姓名判断、偉人の名前の姓名判断、名前に使える漢字の辞典、四字熟語・ことわざの意味を調べられます。四字熟語・ことわざの意味と例文は、このサイトで書いたものです。</p>
<h2>計算の方法</h2>
<p>画数は新字体で数え、五格（天格・人格・地格・外格・総格）と三才配置を出しています。数の吉凶は熊崎式の流れをくむ一般的な区分です。流派によって、一部の数の扱いや画数の数え方が異なります。</p>
<p>評価（💮◎〇△）は、人格35％・総格30％・地格15％・外格10％・三才配置10％の重みで吉凶をまとめた、このサイト独自の目安です。</p>
<h2>偉人のページについて</h2>
<p>載せているのは歴史上の人物だけです。人物の説明は、広く知られている事実を短くまとめています。姓名判断の結果は、その人の生き方や功績を評価するものではありません。</p>
<h2>使っているデータ</h2>
<p>画数データの一部に、文字情報基盤（MJ文字情報一覧表、独立行政法人情報処理推進機構）を使っています。ライセンスは<a href="https://creativecommons.org/licenses/by-sa/2.1/jp/" rel="license noopener">CC BY-SA 2.1 JP</a>です。</p>
</section>` }));
write("privacy", page({ path: "privacy/", title: `プライバシーポリシー｜${SITE}`, desc: `${SITE}のプライバシーポリシー。`, crumbs: [{ name: "プライバシーポリシー", path: "privacy/" }],
  body: `<section class="sec prose">
<h2>入力した名前について</h2>
<p>姓名判断で入力した名前は、お使いの端末の中だけで計算します。サーバーに送ったり、保存したりしません。結果のリンクには名前がふくまれるので、シェアするときはご注意ください。</p>
<h2>アクセス解析について</h2>
<p>サイトの改善のため、Googleアナリティクスを使う場合があります。Cookieを使って、個人を特定しない形でアクセス情報を集めます。入力した名前は送りません。</p>
<h2>広告について</h2>
<p>第三者配信の広告サービス（Google AdSense）を使う場合があります。広告配信事業者は、Cookieを使ってユーザーの興味に合わせた広告を表示することがあります。パーソナライズ広告は<a href="https://adssettings.google.com/" rel="noopener">広告設定</a>で無効にできます。</p>
<h2>免責事項</h2>
<p>姓名判断の結果は目安です。名前に関する大切な判断は、ご自身の考えを大切にしてください。</p>
</section>` }));

// ---- 漢字辞典 ----
const kanji = buildKanji({ ROOT, page, write, esc, people, L, phrases: phrasesByChar() });
const phrases = buildPhrases({ page, write, esc, kanjiSet: kanji.set });

// ---- sitemap・robots ----
const urls = ["", "ijin/", ...people.map((p) => `ijin/${p.slug}/`), ...kanji.urls, ...phrases.urls, "about/", "privacy/"];
writeFileSync(join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${BASE}/${encodeURI(u)}</loc></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`);
console.log("built", urls.length, "pages");
