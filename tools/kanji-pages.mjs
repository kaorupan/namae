// 漢字辞典のページ：kanji/（さくいん）／kanji/<字>/／kanji/kakusu/<画数>/／kanji/yomi/<読み>/／kanji/bushu/<番号>/／kanji/kyuji/（旧字体）
//   データは data/kanji.json（tools/kanji-data.mjs で作る）。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import IMI from "../data/kanji-imi.mjs";
import BUSHU from "../data/bushu.mjs";

const kata2hira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const GYO = [["あ", "あいうえお"], ["か", "かきくけこがぎぐげご"], ["さ", "さしすせそざじずぜぞ"], ["た", "たちつてとだぢづでど"], ["な", "なにぬねの"], ["は", "はひふへほばびぶべぼぱぴぷぺぽ"], ["ま", "まみむめも"], ["や", "やゆよ"], ["ら", "らりるれろ"], ["わ", "わを"]];
const gyoOf = (r) => (GYO.find(([, cs]) => cs.includes(r[0])) || ["他"])[0];
const TYPE = { joyo: "常用漢字", jinmei: "人名用漢字" };

export function buildKanji({ ROOT, page, write, esc, people, L, phrases = new Map() }) {
  const K = JSON.parse(readFileSync(join(ROOT, "data/kanji.json"), "utf8"));
  const byCh = new Map(K.map((k) => [k.ch, k]));
  // 読み（音読みはひらがなにする）。名前の読みさがしに使うので、送りがなのない形もそろえる
  const keys = (k) => [...new Set([...k.on.map(kata2hira), ...k.kun])].filter((r) => /^[ぁ-ゖー]+$/.test(r));
  const byYomi = new Map(), byStroke = new Map(), byRad = new Map();
  for (const k of K) {
    for (const r of keys(k)) (byYomi.get(r) || byYomi.set(r, []).get(r)).push(k);
    (byStroke.get(k.strokes) || byStroke.set(k.strokes, []).get(k.strokes)).push(k);
    (byRad.get(k.rad) || byRad.set(k.rad, []).get(k.rad)).push(k);
  }
  const yomiPages = [...byYomi.entries()].filter(([, ks]) => ks.length >= 2).sort((a, b) => a[0].localeCompare(b[0], "ja"));
  const yomiSet = new Set(yomiPages.map(([r]) => r));
  const strokesList = [...byStroke.keys()].sort((a, b) => a - b);
  const radName = (n) => BUSHU[n - 1] || "";
  const radList = [...byRad.keys()].sort((a, b) => a - b);
  const KY = JSON.parse(readFileSync(join(ROOT, "data/kyuji.json"), "utf8"));
  const kyujiOnly = KY.filter((x) => !byCh.has(x.old) && byCh.has(x.ch));
  const ijinBy = new Map();
  for (const p of people) for (const c of new Set([...(p.sei + p.mei)])) (ijinBy.get(c) || ijinBy.set(c, []).get(c)).push(p);

  const chip = (k, up) => `<li><a href="${up}${k.ch}/" title="${esc(TYPE[k.type])}・${k.strokes}画">${esc(k.ch)}</a></li>`;
  const chips = (ks, up) => `<ul class="kchips">${ks.map((k) => chip(k, up)).join("")}</ul>`;
  const yomiLink = (r, up) => yomiSet.has(r) ? `<a href="${up}yomi/${r}/">${esc(r)}</a>` : esc(r);
  const urls = [];

  // ---- 漢字ごと ----
  for (const k of K) {
    const up = "../";
    const onH = k.on.map(kata2hira);
    const luck = L.of(k.strokes);
    const sameStroke = byStroke.get(k.strokes).filter((x) => x !== k);
    const sameRad = byRad.get(k.rad).filter((x) => x !== k);
    const sameYomi = [...new Set(keys(k).flatMap((r) => (byYomi.get(r) || []).filter((x) => x !== k)))];
    const ijin = ijinBy.get(k.ch) || [];
    const readingRows = k.type === "joyo"
      ? `<table class="ktable"><thead><tr><th scope="col">読み</th><th scope="col">例</th></tr></thead><tbody>${k.readings.map((r) => `<tr><th scope="row">${esc(r.r)}<small>${r.on ? "音" : "訓"}</small></th><td>${esc(r.ex.join("、"))}${r.note ? `<br><small>${esc(r.note)}</small>` : ""}</td></tr>`).join("")}</tbody></table>
<p class="note">読みと例は、文化庁「常用漢字表」によります。カタカナは音読み、ひらがなは訓読みです。</p>`
      : `${k.readings.length ? `<table class="ktable"><thead><tr><th scope="col">読み</th><th scope="col">種類</th></tr></thead><tbody>${k.readings.map((r) => `<tr><th scope="row">${esc(r.r)}</th><td>${r.on ? "音読み" : "訓読み"}</td></tr>`).join("")}</tbody></table>` : ""}
<p class="note">人名用漢字には、国が定めた読みはありません。ここでは辞書などで知られている読みを参考として載せています。名前の読み方は自由に決められます。</p>`;
    const parentNote = k.parent ? `「${esc(k.ch)}」は常用漢字「<a href="../${k.parent}/">${esc(k.parent)}</a>」の旧字体・異体字で、人名用漢字として名前に使えます。読みは「${esc(k.parent)}」と同じです。` : "";
    const variant = [k.old ? `旧字体は「${esc(k.old)}」です。` : "", k.jinmeiVariants.length ? `${k.jinmeiVariants.map((c) => byCh.has(c) ? `「<a href="../${c}/">${esc(c)}</a>」` : `「${esc(c)}」`).join("")}も人名用漢字として名前に使えます。` : ""].join("");
    const readTxt = [onH.length ? `音読みは「${onH.join("・")}」` : "", k.kun.length ? `訓読みは「${k.kun.slice(0, 4).join("・")}」` : ""].filter(Boolean).join("、");
    const desc = `「${k.ch}」は${k.strokes}画の${TYPE[k.type]}。${IMI[k.ch] ? "意味は「" + IMI[k.ch][0].replace(/。$/, "") + "」。" : ""}${readTxt || "読み"}など。部首は「${k.radCh}」。名前に使えるか、姓名判断での画数、同じ読み・同じ画数の漢字も紹介します。`;
    const body = `<section class="sec kmain" aria-label="基本の情報">
<div class="kbig" aria-hidden="true">${esc(k.ch)}</div>
<dl class="kinfo">
${IMI[k.ch] ? `<div><dt>意味</dt><dd>${esc(IMI[k.ch][0])}</dd></div>` : ""}
<div><dt>画数</dt><dd><a href="${up}kakusu/${k.strokes}/">${k.strokes}画</a></dd></div>
<div><dt>部首</dt><dd><a href="${up}bushu/${k.rad}/">${esc(k.radCh)}</a><small>（${esc(radName(k.rad))}）</small></dd></div>
<div><dt>種類</dt><dd>${TYPE[k.type]}</dd></div>
${onH.length ? `<div><dt>音読み</dt><dd>${onH.map((r) => yomiLink(r, up)).join("・")}</dd></div>` : ""}
${k.kun.length ? `<div><dt>訓読み</dt><dd>${k.kun.map((r) => yomiLink(r, up)).join("・")}</dd></div>` : ""}
${k.old ? `<div><dt>旧字体</dt><dd>${KY.some((x) => x.old === k.old) ? `<a href="../${k.old}/">${esc(k.old)}</a>` : esc(k.old)}</dd></div>` : ""}
${k.parent ? `<div><dt>新字体</dt><dd><a href="../${k.parent}/">${esc(k.parent)}</a></dd></div>` : ""}
</dl>
</section>
<section class="sec" aria-labelledby="yomi"><h2 id="yomi">「${esc(k.ch)}」の読みと使い方</h2>${readingRows}</section>
<section class="sec prose" aria-labelledby="name"><h2 id="name">「${esc(k.ch)}」は名前に使える？</h2>
<p><b>使えます。</b>「${esc(k.ch)}」は${TYPE[k.type]}なので、子どもの名前に使うことができます。${parentNote || variant}</p>
${IMI[k.ch] ? `<p>名前に使うときは「<b>${esc(IMI[k.ch][1].replace(/。$/, ""))}</b>」といった願いをこめることができます。</p>` : ""}
<p>姓名判断では「${esc(k.ch)}」を<b>${k.strokes}画</b>として数えます（新字体）。${k.strokes}は「${esc(luck.keyword)}」の意味をもつ${luck.luck}数ですが、姓名判断は名前全体の画数（五格）で見るので、一字だけでよし悪しは決まりません。</p>
<p><a class="btn" href="../../">「${esc(k.ch)}」を使った名前を姓名判断する</a></p>
</section>
${ijin.length ? `<section class="sec" aria-labelledby="ijin"><h2 id="ijin">「${esc(k.ch)}」が名前に入っている偉人</h2><ul class="people">${ijin.map((p) => `<li><a href="../../ijin/${p.slug}/"><span class="nm">${esc(p.sei + p.mei)}</span><span class="sub">${esc(p.era)}・${esc(p.fieldName)}</span><span class="mk">${p.rt.mark.mark}</span></a></li>`).join("")}</ul></section>` : ""}
${(phrases.get(k.ch) || []).length ? `<section class="sec" aria-labelledby="ph"><h2 id="ph">「${esc(k.ch)}」を使う四字熟語・ことわざ</h2><ul class="plist">${phrases.get(k.ch).map((x) => `<li><a href="../../${x.dir}/${x.w}/"><b>${esc(x.w)}</b><small>${esc(x.kind)}・${esc(x.y)}</small></a></li>`).join("")}</ul></section>` : ""}
${sameYomi.length ? `<section class="sec" aria-labelledby="sy"><h2 id="sy">同じ読みの漢字</h2>${chips(sameYomi.slice(0, 40), up)}</section>` : ""}
<section class="sec" aria-labelledby="ss"><h2 id="ss">同じ${k.strokes}画の漢字</h2>${chips(sameStroke.slice(0, 40), up)}${sameStroke.length > 40 ? `<p><a href="${up}kakusu/${k.strokes}/">${k.strokes}画の漢字をすべて見る（${sameStroke.length + 1}字）→</a></p>` : ""}</section>
${sameRad.length ? `<section class="sec" aria-labelledby="sr"><h2 id="sr">同じ部首（${esc(k.radCh)}・${esc(radName(k.rad).split("・")[0])}）の漢字</h2>${chips(sameRad.slice(0, 40), up)}<p><a href="${up}bushu/${k.rad}/">部首「${esc(k.radCh)}」の漢字をすべて見る →</a></p></section>` : ""}`;
    write(`kanji/${k.ch}`, page({ path: `kanji/${k.ch}/`, title: IMI[k.ch] ? `「${k.ch}」の意味と読み方｜名前にこめる願い・画数【${TYPE[k.type]}】` : k.old ? `「${k.ch}」の読み方・画数・旧字体「${k.old}」｜名前に使える？` : `「${k.ch}」の読み方・画数・部首｜名前に使える？【${TYPE[k.type]}】`, h1: `「${esc(k.ch)}」の漢字`, desc,
      crumbs: [{ name: "漢字辞典", path: "kanji/" }, { name: `「${k.ch}」`, path: `kanji/${k.ch}/` }], body }));
    urls.push(`kanji/${k.ch}/`);
  }

  // ---- 画数別 ----
  for (const n of strokesList) {
    const ks = byStroke.get(n), up = "../../";
    const jo = ks.filter((k) => k.type === "joyo"), ji = ks.filter((k) => k.type === "jinmei");
    const l = L.of(n);
    const body = `<p class="lead">${n}画の漢字は${ks.length}字（常用漢字${jo.length}字・人名用漢字${ji.length}字）。どれも子どもの名前に使えます。字をえらぶと、読み方と部首がわかります。</p>
${jo.length ? `<section class="sec" aria-labelledby="j"><h2 id="j">${n}画の常用漢字</h2>${chips(jo, up)}</section>` : ""}
${ji.length ? `<section class="sec" aria-labelledby="m"><h2 id="m">${n}画の人名用漢字</h2>${chips(ji, up)}</section>` : ""}
<section class="sec prose" aria-labelledby="s"><h2 id="s">姓名判断での${n}画</h2><p>姓名判断で${n}は「${esc(l.keyword)}」の意味をもつ${l.luck}数です。画数は新字体で数えています。名前全体の評価は<a href="${up}../">姓名判断</a>で見られます。</p></section>
<nav class="sec" aria-label="ほかの画数"><h2>ほかの画数</h2><ul class="kchips">${strokesList.map((m) => `<li><a href="../${m}/"${m === n ? ' aria-current="page"' : ""}>${m}画</a></li>`).join("")}</ul></nav>`;
    write(`kanji/kakusu/${n}`, page({ path: `kanji/kakusu/${n}/`, title: `${n}画の漢字一覧【${ks.length}字】名前に使える常用漢字・人名用漢字`, h1: `${n}画の漢字`,
      desc: `${n}画の漢字${ks.length}字の一覧。常用漢字と人名用漢字に分けて、名前に使える${n}画の漢字を紹介します。`,
      crumbs: [{ name: "漢字辞典", path: "kanji/" }, { name: `${n}画の漢字`, path: `kanji/kakusu/${n}/` }], body }));
    urls.push(`kanji/kakusu/${n}/`);
  }

  // ---- 読み別 ----
  const exOf = (k, r) => (k.readings || []).filter((x) => kata2hira(x.r) === r).flatMap((x) => x.ex).slice(0, 3);
  for (const [r, ks] of yomiPages) {
    const up = "../../";
    const sorted = ks.slice().sort((a, b) => (a.type === b.type ? 0 : a.type === "joyo" ? -1 : 1) || a.strokes - b.strokes);
    const onK = sorted.filter((k) => k.on.map(kata2hira).includes(r)), kunK = sorted.filter((k) => k.kun.includes(r));
    const row = (k) => { const ex = exOf(k, r); return `<tr><th scope="row"><a class="kbig-s" href="${up}${k.ch}/">${esc(k.ch)}</a></th><td>${k.strokes}画<br><small>${TYPE[k.type]}</small></td><td>${IMI[k.ch] ? esc(IMI[k.ch][0]) : ""}${ex.length ? `<br><small>例：${esc(ex.join("、"))}</small>` : ""}${!IMI[k.ch] && !ex.length ? `<a href="${up}${k.ch}/">意味・読み方を見る</a>` : ""}</td></tr>`; };
    const table = (list) => `<table class="ktable yomi-t"><thead><tr><th scope="col">漢字</th><th scope="col">画数</th><th scope="col">意味・使い方</th></tr></thead><tbody>${list.map(row).join("")}</tbody></table>`;
    const top = sorted.slice(0, 6).map((k) => k.ch).join("・");
    const near = yomiPages.filter(([x]) => x !== r && x[0] === r[0]).slice(0, 16);
    const body = `<p class="lead">「${esc(r)}」と読む漢字は、${esc(top)}など${ks.length}字あります。常用漢字を先に、画数の少ない順に並べました。どれも子どもの名前に使える字です。</p>
${onK.length ? `<section class="sec" aria-labelledby="lo"><h2 id="lo">音読みで「${esc(r)}」と読む漢字（${onK.length}字）</h2>${table(onK)}</section>` : ""}
${kunK.length ? `<section class="sec" aria-labelledby="lk"><h2 id="lk">訓読みで「${esc(r)}」と読む漢字（${kunK.length}字）</h2>${table(kunK)}</section>` : ""}
<section class="sec prose" aria-labelledby="ln"><h2 id="ln">読みについて</h2><p>常用漢字の読みと例は文化庁「常用漢字表」、人名用漢字の読みは辞書などで知られている読みです。名前の読み方は、ここにない読みでも常識の範囲で自由に決められます。</p>
<p><a href="${up}../akachan/">「${esc(r)}」の響きの名前をさがす →</a></p></section>
${near.length ? `<nav class="sec" aria-labelledby="lx"><h2 id="lx">「${esc(r[0])}」ではじまるほかの読み</h2><ul class="kchips is-wide">${near.map(([x]) => `<li><a href="../${x}/">${esc(x)}</a></li>`).join("")}</ul></nav>` : ""}`;
    write(`kanji/yomi/${r}`, page({ path: `kanji/yomi/${r}/`, title: `「${r}」と読む漢字一覧【${ks.length}字】${top}など｜意味つき`, h1: `「${esc(r)}」と読む漢字`,
      desc: `「${r}」と読む漢字${ks.length}字の一覧。${top}など、音読み・訓読みに分けて、意味・画数・使い方の例を紹介します。`,
      crumbs: [{ name: "漢字辞典", path: "kanji/" }, { name: `「${r}」と読む漢字`, path: `kanji/yomi/${r}/` }], body }));
    urls.push(`kanji/yomi/${r}/`);
  }

  // ---- 部首別 ----
  for (const n of radList) {
    const ks = byRad.get(n).slice().sort((a, b) => a.strokes - b.strokes || (a.type === "joyo" ? -1 : 1));
    const rc = ks[0].radCh, nm = radName(n), up = "../../";
    const body = `<p class="lead">部首「${esc(rc)}」（${esc(nm)}）の漢字は${ks.length}字。名前に使える常用漢字・人名用漢字を、画数の少ない順に並べました。</p>
<section class="sec" aria-labelledby="b1"><h2 id="b1">部首「${esc(rc)}」の漢字</h2>${chips(ks, up)}</section>
<section class="sec prose" aria-labelledby="b2"><h2 id="b2">部首について</h2><p>部首は、康熙字典の214部首の分け方によります。辞書によっては、同じ字でも別の部首に分けていることがあります（たとえば新字体で形が変わった字など）。</p></section>
<nav class="sec" aria-labelledby="b3"><h2 id="b3">ほかの部首</h2><ul class="kchips">${radList.map((m) => `<li><a href="../${m}/" title="${esc(radName(m))}"${m === n ? ' aria-current="page"' : ""}>${esc(byRad.get(m)[0].radCh)}</a></li>`).join("")}</ul></nav>`;
    write(`kanji/bushu/${n}`, page({ path: `kanji/bushu/${n}/`, title: `${nm.split("・").pop()}（部首「${rc}」）の漢字一覧【${ks.length}字】読み方・画数つき`, h1: `部首「${esc(rc)}」の漢字`,
      desc: `部首「${rc}」（${nm}）の漢字${ks.length}字の一覧。${ks.slice(0, 8).map((k) => k.ch).join("・")}など、名前に使える漢字を画数順に紹介します。`,
      crumbs: [{ name: "漢字辞典", path: "kanji/" }, { name: "部首", path: "kanji/bushu/" }, { name: `部首「${rc}」`, path: `kanji/bushu/${n}/` }], body }));
    urls.push(`kanji/bushu/${n}/`);
  }
  write("kanji/bushu", page({ path: "kanji/bushu/", title: "部首一覧と呼び方｜さんずい・きへんなど部首から漢字をさがす", h1: "部首から漢字をさがす",
    desc: "名前に使える漢字を、部首からさがせる一覧です。部首の呼び名（さんずい・きへんなど）と、その部首の漢字の数がわかります。",
    crumbs: [{ name: "漢字辞典", path: "kanji/" }, { name: "部首", path: "kanji/bushu/" }],
    body: `<section class="sec"><ul class="bushu-list">${radList.map((n) => `<li><a href="${n}/"><b>${esc(byRad.get(n)[0].radCh)}</b><span>${esc(radName(n))}</span><small>${byRad.get(n).length}字</small></a></li>`).join("")}</ul>
<p class="note">部首は康熙字典の214部首の分け方によります。辞書によって部首が異なる字もあります。</p></section>` }));
  urls.push("kanji/bushu/");

  // ---- 旧字体 ----
  for (const x of kyujiOnly) {
    const k = byCh.get(x.ch), up = "../";
    const onH = k.on.map(kata2hira);
    const body = `<section class="sec kmain" aria-label="基本の情報">
<div class="kbig" aria-hidden="true">${esc(x.old)}</div>
<dl class="kinfo">
<div><dt>新字体</dt><dd><a href="../${x.ch}/">${esc(x.ch)}</a></dd></div>
${onH.length ? `<div><dt>音読み</dt><dd>${onH.map((r) => yomiLink(r, up)).join("・")}</dd></div>` : ""}
${k.kun.length ? `<div><dt>訓読み</dt><dd>${k.kun.map((r) => yomiLink(r, up)).join("・")}</dd></div>` : ""}
${x.strokes ? `<div><dt>画数</dt><dd>${x.strokes}画<small>（新字体の「${esc(x.ch)}」は${k.strokes}画）</small></dd></div>` : ""}
</dl></section>
<section class="sec prose" aria-labelledby="o1"><h2 id="o1">「${esc(x.old)}」は「${esc(x.ch)}」の旧字体</h2>
<p>「${esc(x.old)}」は、常用漢字「<a href="../${x.ch}/">${esc(x.ch)}</a>」の旧字体（康熙字典体）です。読み方と意味は「${esc(x.ch)}」と同じで、${onH.length ? `音読みは「${esc(onH.join("・"))}」` : ""}${onH.length && k.kun.length ? "、" : ""}${k.kun.length ? `訓読みは「${esc(k.kun.slice(0, 4).join("・"))}」` : ""}です。${IMI[x.ch] ? `意味は「${esc(IMI[x.ch][0].replace(/。$/, ""))}」。` : ""}</p>
<p>戦後の漢字の整理で、ふだん使う字は新字体の「${esc(x.ch)}」になりました。旧字体は、古い文書や人名・地名、お店の名前などで今も見ることがあります。</p></section>
<section class="sec prose" aria-labelledby="o2"><h2 id="o2">「${esc(x.old)}」は名前に使える？</h2>
<p>「${esc(x.old)}」は常用漢字・人名用漢字に入っていないため、<b>新しく子どもの名前に使うことはできません</b>。名前には新字体の「<a href="../${x.ch}/">${esc(x.ch)}</a>」を使います。</p>
<p class="note">すでに戸籍に旧字体で登録されている名字や名前は、そのまま使われています。</p></section>
<section class="sec" aria-labelledby="o3"><h2 id="o3">ほかの旧字体</h2><p><a href="../kyuji/">新字体と旧字体の一覧を見る →</a></p></section>`;
    write(`kanji/${x.old}`, page({ path: `kanji/${x.old}/`, title: `「${x.old}」の読み方は？「${x.ch}」の旧字体｜意味・画数・名前に使える？`, h1: `「${esc(x.old)}」の読み方（「${esc(x.ch)}」の旧字体）`,
      desc: `「${x.old}」は「${x.ch}」の旧字体です。読み方は${onH.length ? `「${onH.join("・")}」` : ""}${k.kun.length ? `「${k.kun.slice(0, 3).join("・")}」` : ""}など。画数や、名前に使えるかどうかも紹介します。`,
      crumbs: [{ name: "漢字辞典", path: "kanji/" }, { name: "旧字体", path: "kanji/kyuji/" }, { name: `「${x.old}」`, path: `kanji/${x.old}/` }], body }));
    urls.push(`kanji/${x.old}/`);
  }
  write("kanji/kyuji", page({ path: "kanji/kyuji/", title: `旧字体一覧表【${KY.length}字】新字体との対応がひと目でわかる`, h1: "新字体と旧字体の一覧",
    desc: `常用漢字の新字体と旧字体（康熙字典体）の対応表です。學→学、應→応、櫻→桜など${KY.length}字。旧字体の読み方と、名前に使えるかどうかもわかります。`,
    crumbs: [{ name: "漢字辞典", path: "kanji/" }, { name: "旧字体", path: "kanji/kyuji/" }],
    body: `<p class="lead">常用漢字の新字体と、旧字体（康熙字典体）の対応表です。字をえらぶと、読み方や意味がわかります。<span class="kyuji-ok">名</span>がついた旧字体は、人名用漢字として名前に使えます。</p>
<section class="sec"><ul class="kyuji-list">${KY.map((x) => `<li><a href="../${x.ch}/" class="k-new">${esc(x.ch)}</a><span aria-hidden="true">→</span><a href="../${x.old}/" class="k-old">${esc(x.old)}</a>${byCh.has(x.old) ? '<span class="kyuji-ok" title="人名用漢字">名</span>' : ""}</li>`).join("")}</ul>
<p class="note">旧字体は、文化庁「常用漢字表」に示された康熙字典体によります。</p></section>` }));
  urls.push("kanji/kyuji/");

  // ---- さくいん ----
  {
    const gyo = GYO.map(([g]) => [g, yomiPages.filter(([r]) => gyoOf(r) === g)]);
    const body = `<p class="lead">名前に使える漢字（常用漢字${K.filter((k) => k.type === "joyo").length}字・人名用漢字${K.filter((k) => k.type === "jinmei").length}字）の読み方・画数・部首を調べられます。</p>
<section class="sec" aria-labelledby="f"><h2 id="f">漢字を入れて調べる</h2>
<form id="kanji-form" class="form" data-list="${esc(K.map((k) => k.ch).join(""))}" novalidate>
<div class="field"><label for="kq">漢字1字</label><input id="kq" name="q" maxlength="2" placeholder="例：翔" autocomplete="off"></div>
<p id="kq-err" class="err" role="alert" hidden></p>
<button class="btn" type="submit">調べる</button></form></section>
<section class="sec" aria-labelledby="kb"><h2 id="kb">部首・旧字体から探す</h2><p><a class="btn" href="bushu/">部首から探す</a> <a class="btn" href="kyuji/">新字体と旧字体の一覧</a></p></section>
<section class="sec" aria-labelledby="k"><h2 id="k">画数から探す</h2><ul class="kchips">${strokesList.map((n) => `<li><a href="kakusu/${n}/">${n}画</a></li>`).join("")}</ul></section>
<section class="sec" aria-labelledby="y"><h2 id="y">読みから探す</h2>
${gyo.filter(([, rs]) => rs.length).map(([g, rs]) => `<h3>${g}行</h3><ul class="kchips is-wide">${rs.map(([r, ks]) => `<li><a href="yomi/${r}/">${esc(r)}<small>${ks.length}</small></a></li>`).join("")}</ul>`).join("\n")}
</section>`;
    write("kanji", page({ path: "kanji/", title: "名前に使える漢字辞典｜読み方・画数・部首・意味で探せる【無料】", h1: "漢字辞典",
      desc: "名前に使える常用漢字・人名用漢字の読み方・画数・部首を調べられる漢字辞典。画数別・読み別の一覧から、名づけに使う漢字も探せます。",
      crumbs: [{ name: "漢字辞典", path: "kanji/" }], scripts: ["kanji-search.js"], body }));
    urls.unshift("kanji/");
  }
  return { urls, count: K.length, set: new Set(K.map((k) => k.ch)) };
}
