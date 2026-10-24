// なまえ帖（仮）のページを作る：node tools/build.mjs
//   index.html（TOP・姓名判断）／ijin/（偉人の一覧）／ijin/<slug>/（偉人ごとの姓名判断）／about/／privacy/／sitemap.xml／robots.txt
//   偉人のページの結果は、ここで計算して HTML に書きこむ（検索エンジンにも中身が見えるように）。
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildKanji } from "./kanji-pages.mjs";
import { buildPhrases, phrasesByChar } from "./phrase-pages.mjs";
import NAMES from "../data/names.mjs";
import IMI from "../data/kanji-imi.mjs";

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
  const nav = [["", "姓名判断"], ["akachan/", "赤ちゃんの名前"], ["nazuke/", "候補くらべ"], ["kanji/", "漢字"], ["yoji/", "四字熟語"], ["kotowaza/", "ことわざ"], ["ijin/", "偉人"]];
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
<meta name="theme-color" content="#ff7aa2">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700&display=swap">
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
<ul><li><a href="${up}">姓名判断</a></li><li><a href="${up}akachan/">赤ちゃんの名前さがし</a></li><li><a href="${up}nazuke/">名づけ候補くらべ</a></li><li><a href="${up}kanji/">漢字辞典</a></li><li><a href="${up}yoji/">四字熟語</a></li><li><a href="${up}kotowaza/">ことわざ</a></li><li><a href="${up}ijin/">偉人の名前</a></li><li><a href="${up}about/">このサイトについて</a></li><li><a href="${up}privacy/">プライバシーポリシー</a></li></ul>
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
  const body = `<div class="hero">
<svg class="hero-art" viewBox="0 0 160 120" aria-hidden="true">
<circle cx="80" cy="62" r="46" fill="var(--lemon-soft)"/>
<rect x="44" y="34" width="72" height="56" rx="14" fill="var(--paper)" stroke="var(--pink)" stroke-width="4"/>
<circle cx="80" cy="34" r="7" fill="var(--pink)"/>
<text x="80" y="76" text-anchor="middle" font-size="30" font-weight="700" fill="var(--ink)" font-family="var(--kanji)">名前</text>
<path d="M22 28l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="var(--lemon)"/>
<path d="M138 20l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="var(--mint)"/>
<path d="M132 92l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="var(--pink)"/>
<circle cx="24" cy="92" r="5" fill="var(--sky)"/><circle cx="146" cy="58" r="4" fill="var(--lemon)"/>
</svg>
<p class="lead">姓と名を入れるだけ！名前の画数から五格を出して、<b>💮◎〇△</b>の4段階で評価します。あなたの名前に似ている偉人も見つかるよ。</p>
<ul class="hero-tags" aria-label="わかること"><li>💮◎〇△の評価</li><li>五格の意味</li><li>似ている偉人</li></ul>
</div>
<section class="sec sec-form" aria-labelledby="f">
<h2 id="f">名前を入れてください</h2>
<form id="name-form" class="form" novalidate>
<div class="form-row">
<div class="field"><label for="sei">姓</label><input id="sei" name="sei" autocomplete="family-name" maxlength="10" placeholder="例：佐藤" required></div>
<div class="field"><label for="mei">名</label><input id="mei" name="mei" autocomplete="given-name" maxlength="10" placeholder="例：太郎" required></div>
</div>
<p id="name-err" class="err" role="alert" hidden></p>
<button class="btn btn-big" type="submit">✿ 姓名判断をする</button>
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
<li><a href="akachan/"><b>赤ちゃんの名前さがし</b><span>名字を入れるだけで、評価のよい名前をずらっと表示します。</span></a></li>
<li><a href="nazuke/"><b>名づけ候補くらべ</b><span>赤ちゃんの名前の候補をいくつでも入れて、評価の高い順にくらべられます。</span></a></li>
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
    scripts: ["seimei-strokes.js", "seimei.js", "luck.js", "ijin.js", "core.js", "kanji-imi-data.js", "app.js"],
    jsonld: [{ "@context": "https://schema.org", "@type": "WebApplication", name: SITE + " 姓名判断", url: BASE + "/", applicationCategory: "LifestyleApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" } }],
    body }));
}

writeFileSync(join(ROOT, "assets/js/kanji-imi-data.js"), "/* 名づけ用の漢字の意味（data/kanji-imi.mjs から作る。手で直さない） */\n(self.Namae = self.Namae || {}).kanjiImi = " + JSON.stringify(IMI) + ";\n");
// ---- 赤ちゃんの名前さがし ----
writeFileSync(join(ROOT, "assets/js/names-data.js"), "/* 赤ちゃんの名前の候補（data/names.mjs から作る。手で直さない） */\n(self.Namae = self.Namae || {}).names = " + JSON.stringify(NAMES.map((n) => [n.mei, n.yomi, n.g])) + ";\n");
write("akachan", page({ path: "akachan/", title: `赤ちゃんの名前さがし｜名字に合う名前を姓名判断で探す｜${SITE}`, h1: "赤ちゃんの名前さがし",
  desc: `名字を入れるだけで、赤ちゃんの名前の候補を姓名判断の評価（💮◎〇△）がよい順に表示します。男の子・女の子、文字数、響き、好きな漢字でもしぼりこめます。`,
  crumbs: [{ name: "赤ちゃんの名前さがし", path: "akachan/" }], scripts: ["seimei-strokes.js", "seimei.js", "luck.js", "core.js", "names-data.js", "akachan.js"],
  body: `<div class="hero">
<svg class="hero-art" viewBox="0 0 160 120" aria-hidden="true">
<circle cx="80" cy="64" r="48" fill="var(--pink-soft)"/>
<circle cx="80" cy="62" r="26" fill="var(--paper)" stroke="var(--pink)" stroke-width="4"/>
<circle cx="71" cy="60" r="3" fill="var(--ink)"/><circle cx="89" cy="60" r="3" fill="var(--ink)"/>
<path d="M73 70q7 6 14 0" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/>
<circle cx="64" cy="68" r="4" fill="var(--pink)" opacity=".5"/><circle cx="96" cy="68" r="4" fill="var(--pink)" opacity=".5"/>
<path d="M80 36q-6-10 4-12" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M24 26l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="var(--lemon)"/><path d="M138 22l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="var(--mint)"/>
<path d="M128 94c-6-6-14 2-6 8l6 5 6-5c8-6 0-14-6-8z" fill="var(--pink)"/>
</svg>
<p class="lead">名字を入れるだけで、${new Set(NAMES.map((n) => n.mei)).size}の名前から<b>姓名判断の評価がよい順</b>にずらっと表示します。気に入った名前は♥で候補に入れて、あとでくらべられます。</p>
<ul class="hero-tags" aria-label="できること"><li>名字に合う名前</li><li>響き・漢字でしぼりこみ</li><li>♥で候補に保存</li></ul>
</div>
<section class="sec sec-form" aria-labelledby="af">
<h2 id="af">条件を入れて名前をさがす</h2>
<form id="ak-form" class="form ak-form" novalidate>
<div class="field"><label for="ak-sei">名字（必須）</label><input id="ak-sei" name="sei" autocomplete="family-name" maxlength="6" placeholder="例：佐藤" required></div>
<fieldset class="ak-g"><legend>性別</legend>
<label><input type="radio" name="g" value="all" checked><span>指定なし</span></label>
<label><input type="radio" name="g" value="m"><span>男の子</span></label>
<label><input type="radio" name="g" value="f"><span>女の子</span></label>
</fieldset>
<div class="form-row">
<div class="field"><label for="ak-min">評価</label><select id="ak-min" name="min"><option value="hana">💮だけ</option><option value="niju" selected>◎以上</option><option value="maru">〇以上</option><option value="all">すべて</option></select></div>
<div class="field"><label for="ak-len">名前の文字数</label><select id="ak-len" name="len"><option value="">指定なし</option><option value="1">1文字</option><option value="2">2文字</option><option value="3">3文字以上</option></select></div>
</div>
<div class="form-row">
<div class="field"><label for="ak-oto">響き（読みのはじめ）</label><input id="ak-oto" name="oto" maxlength="6" placeholder="例：はる" autocomplete="off"></div>
<div class="field"><label for="ak-kanji">使いたい漢字</label><input id="ak-kanji" name="kanji" maxlength="2" placeholder="例：陽" autocomplete="off"></div>
</div>
<p id="ak-err" class="err" role="alert" hidden></p>
<button class="btn btn-big" type="submit">✿ 名前をさがす</button>
<p class="note">入力した内容は、この画面の中だけで計算します。どこにも送りません。</p>
</form>
</section>
<section id="ak-result" class="sec" aria-labelledby="ak-title" hidden>
<h2 id="ak-title" tabindex="-1">評価のよい名前</h2>
<div id="ak-sum" class="ak-sum" aria-live="polite"></div>
<ol id="ak-list" class="nz-list"></ol>
<p class="ak-more-wrap"><button id="ak-more" class="btn" type="button" hidden>もっと見る</button></p>
<p><a id="ak-mylist" class="ak-mylist" href="../nazuke/">♥ 名づけ候補くらべを見る →</a></p>
<p class="note">名前をタップすると、五格のくわしい結果が見られます。ここにある読みは一例です。名前の読み方は、常識の範囲で自由に決められます。評価は画数から出した目安なので、響きや意味、家族の思いも大切にしてください。</p>
</section>
<section class="sec" aria-labelledby="ah">
<h2 id="ah">名前のさがし方</h2>
<ul class="plist ak-ways">
<li><a href="../kanji/yomi/はる/"><b>🔤 音のひびきから</b><span>「はる」「ゆい」など、好きな響きの漢字を一覧で。</span></a></li>
<li><a href="../kanji/"><b>✏️ 好きな漢字から</b><span>名前に使える漢字の意味・読み・画数を調べる。</span></a></li>
<li><a href="../nazuke/"><b>♥ 候補をくらべる</b><span>気になる名前を並べて、評価の順にくらべる。</span></a></li>
<li><a href="../"><b>💮 姓名判断</b><span>決めた名前の五格を、くわしく見る。</span></a></li>
</ul>
</section>
<section class="sec prose" aria-labelledby="ak-tips">
<h2 id="ak-tips">名づけのときに気をつけたいこと</h2>
<ul class="ak-tips">
<li><b>使える漢字</b>：子どもの名前には、常用漢字・人名用漢字・ひらがな・カタカナが使えます。</li>
<li><b>呼びやすさ</b>：名字と続けて声に出してみて、言いやすいか、聞き取りやすいかを確かめましょう。</li>
<li><b>読みやすさ</b>：初めて見た人にも読んでもらいやすいかどうかも、考えておくと安心です。</li>
<li><b>出生届</b>：生まれた日をふくめて14日以内に出します（国外で生まれた場合は3か月以内）。</li>
</ul>
</section>` }));

// ---- 名づけ候補くらべ ----
write("nazuke", page({ path: "nazuke/", title: `名づけ候補くらべ｜赤ちゃんの名前の候補を姓名判断でくらべる｜${SITE}`, h1: "名づけ候補くらべ",
  desc: "赤ちゃんの名前の候補をいくつでも入れて、姓名判断の評価（💮◎〇△）と五格でくらべられます。候補はお使いの端末にだけ保存され、どこにも送りません。",
  crumbs: [{ name: "名づけ候補くらべ", path: "nazuke/" }], scripts: ["seimei-strokes.js", "seimei.js", "luck.js", "ijin.js", "core.js", "nazuke.js"],
  body: `<div class="hero">
<svg class="hero-art" viewBox="0 0 160 120" aria-hidden="true">
<circle cx="80" cy="64" r="46" fill="var(--mint-soft)"/>
<rect x="38" y="40" width="50" height="40" rx="10" fill="var(--paper)" stroke="var(--mint)" stroke-width="4" transform="rotate(-8 63 60)"/>
<rect x="72" y="44" width="50" height="40" rx="10" fill="var(--paper)" stroke="var(--pink)" stroke-width="4" transform="rotate(7 97 64)"/>
<text x="97" y="72" text-anchor="middle" font-size="20" fill="var(--pink-deep)" font-weight="700" transform="rotate(7 97 64)">💮</text>
<text x="63" y="68" text-anchor="middle" font-size="20" fill="var(--mint)" font-weight="700" transform="rotate(-8 63 60)">◎</text>
<path d="M24 26l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="var(--lemon)"/><path d="M140 96l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="var(--sky)"/>
</svg>
<p class="lead">赤ちゃんの名前の候補を、いくつでも入れてくらべられます。姓名判断の評価（<b>💮◎〇△</b>）が高い順に並ぶので、迷ったときのヒントに。</p>
<ul class="hero-tags" aria-label="できること"><li>候補は${60}件まで</li><li>♥でお気に入り</li><li>この端末にだけ保存</li></ul>
</div>
<section class="sec sec-form" aria-labelledby="nf">
<h2 id="nf">名前の候補を入れる</h2>
<form id="nz-form" class="form" novalidate>
<div class="form-row">
<div class="field"><label for="nz-sei">姓（名字）</label><input id="nz-sei" autocomplete="family-name" maxlength="6" placeholder="例：佐藤"></div>
<div class="field"><label for="nz-mei">名前の候補</label><input id="nz-mei" maxlength="40" placeholder="例：陽翔" autocomplete="off"></div>
</div>
<p id="nz-err" class="err" role="alert" hidden></p>
<button class="btn btn-big" type="submit">＋ 候補に追加</button>
</form>
<details class="nz-bulk">
<summary>まとめて入れる</summary>
<form id="nz-bulk-form" class="form" novalidate>
<div class="field"><label for="nz-bulk">候補を改行・スペース・読点（、）で区切って入れてください</label>
<textarea id="nz-bulk" rows="4" placeholder="陽翔&#10;蓮、湊、結菜&#10;さくら"></textarea></div>
<p id="nz-bulk-err" class="err" role="alert" hidden></p>
<button class="btn" type="submit">まとめて追加</button>
</form>
</details>
<p class="note">入れた名前は、この端末のブラウザの中だけに保存します。どこにも送りません。</p>
</section>
<section class="sec" aria-labelledby="nl">
<h2 id="nl">候補の一覧</h2>
<div id="nz-tools" class="nz-tools" hidden>
<p id="nz-count" class="nz-count" aria-live="polite"></p>
<fieldset class="nz-sort"><legend>ならべ方</legend>
<label><input type="radio" name="nz-sort" value="score"> 評価順</label>
<label><input type="radio" name="nz-sort" value="added"> 入れた順</label>
<label><input type="radio" name="nz-sort" value="fav"> ♥が先</label>
</fieldset>
</div>
<ol id="nz-list" class="nz-list" aria-live="polite"></ol>
<p><button id="nz-clear" class="nz-clear" type="button">候補を全部消す</button></p>
<p class="note">名前をタップすると、くわしい五格と似ている偉人が見られます。評価は画数から出した目安です。響きや意味、家族の思いも大切にして選んでください。</p>
</section>
<section class="sec" aria-labelledby="nk">
<h2 id="nk">名前に使う漢字をさがす</h2>
<ul class="plist">
<li><a href="../kanji/"><b>漢字辞典</b><span>名前に使える漢字の読み方・画数・意味</span></a></li>
<li><a href="../kanji/yomi/はる/"><b>「はる」と読む漢字</b><span>読みから漢字をさがす</span></a></li>
<li><a href="../ijin/"><b>偉人の名前</b><span>歴史上の人物の姓名判断</span></a></li>
</ul>
</section>` }));

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
<p>「名づけ候補くらべ」に入れた姓と名前の候補は、あとで見返せるように、お使いの端末のブラウザ（ローカルストレージ）にだけ保存します。サーバーには送りません。「候補を全部消す」ボタンや、ブラウザのサイトデータの削除で消すことができます。</p>
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
const urls = ["", "akachan/", "nazuke/", "ijin/", ...people.map((p) => `ijin/${p.slug}/`), ...kanji.urls, ...phrases.urls, "about/", "privacy/"];
writeFileSync(join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${BASE}/${encodeURI(u)}</loc></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`);
console.log("built", urls.length, "pages");
