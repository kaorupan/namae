// 画数の意味（1〜81）のページ：kazu/ と kazu/<数>/
//   「姓名判断 24画」「総格 31 意味」などで探す人向け。数の吉凶とキーワードは luck.js、文章は data/kazu.mjs。
import KAZU from "../data/kazu.mjs";

const LUCK_ORDER = ["大吉", "吉", "半吉", "凶"];
export function buildKazu({ page, write, esc, L, people, kanjiStrokes }) {
  const urls = [];
  for (let n = 1; n <= 81; n++) {
    const k = KAZU[n], l = L.of(n);
    if (!k) throw new Error("kazu: " + n);
    const jin = people.filter((p) => p.r.jin.value === n), sou = people.filter((p) => p.r.sou.value === n);
    const same = Array.from({ length: 81 }, (_, i) => i + 1).filter((m) => m !== n && L.of(m).luck === l.luck);
    const pl = (p) => `<li><a href="../../ijin/${p.slug}/"><span class="nm">${esc(p.sei + p.mei)}</span><span class="sub">${esc(p.era)}・${esc(p.fieldName)}</span><span class="mk">${p.rt.mark.mark}</span></a></li>`;
    const body = `<section class="sec kz-head" aria-label="${n}画の吉凶">
<div class="kz-num"><b>${n}</b><span>画</span></div>
<div><p class="kz-luck l-${l.luck}">${l.luck}</p><p class="kz-key">${esc(l.keyword)}</p></div>
</section>
<section class="sec prose" aria-labelledby="k1"><h2 id="k1">${n}画の意味</h2><p>${esc(k[0])}</p></section>
<section class="sec prose" aria-labelledby="k2"><h2 id="k2">性格・仕事</h2><p>${esc(k[1])}</p>
<h3>恋愛・家庭</h3><p>${esc(k[2])}</p>
<h3>${n}画を生かすヒント</h3><p>${esc(k[3])}</p></section>
<section class="sec prose" aria-labelledby="k3"><h2 id="k3">どの格にあるときに大切？</h2>
<p>姓名判断では、同じ${n}画でも、五格のどこにあるかで意味の重さが変わります。とくに大切なのは、性格の中心をあらわす<b>人格</b>と、人生全体の流れをあらわす<b>総格</b>です。${n <= 40 ? "" : `${n}画は、名前全体の画数である総格に出ることが多い数です。`}家系から受けつぐ天格の吉凶は、重く見ないのが一般的です。</p>
<p><a class="btn" href="../../">名前を入れて五格を調べる</a></p></section>
${jin.length || sou.length ? `<section class="sec" aria-labelledby="k4"><h2 id="k4">${n}画をもつ偉人</h2>
${jin.length ? `<h3>人格が${n}画</h3><ul class="people">${jin.map(pl).join("")}</ul>` : ""}
${sou.length ? `<h3>総格が${n}画</h3><ul class="people">${sou.map(pl).join("")}</ul>` : ""}</section>` : ""}
${kanjiStrokes.has(n) ? `<section class="sec" aria-labelledby="k5"><h2 id="k5">${n}画の漢字</h2><p>1字で${n}画の漢字は<a href="../../kanji/kakusu/${n}/">${n}画の漢字一覧</a>で見られます。</p></section>` : ""}
<nav class="sec" aria-labelledby="k6"><h2 id="k6">ほかの${l.luck}の数</h2><ul class="kchips is-wide">${same.map((m) => `<li><a href="../${m}/">${m}画</a></li>`).join("")}</ul>
<p class="kz-pn">${n > 1 ? `<a href="../${n - 1}/">← ${n - 1}画</a>` : ""}<a href="../">1〜81の一覧</a>${n < 81 ? `<a href="../${n + 1}/">${n + 1}画 →</a>` : ""}</p></nav>`;
    write(`kazu/${n}`, page({ path: `kazu/${n}/`, title: `姓名判断で${n}画の意味は「${l.luck}」｜${l.keyword}｜なまえ帖`, h1: `${n}画の意味（姓名判断）`,
      desc: `姓名判断の${n}画は${l.luck}数で、「${l.keyword}」を表します。${k[0]}`,
      crumbs: [{ name: "画数の意味", path: "kazu/" }, { name: `${n}画`, path: `kazu/${n}/` }], body }));
    urls.push(`kazu/${n}/`);
  }
  const all = Array.from({ length: 81 }, (_, i) => i + 1);
  const body = `<p class="lead">姓名判断で使う1〜81の数の、吉凶とキーワードの一覧です。数をえらぶと、くわしい意味がわかります。</p>
${LUCK_ORDER.map((g) => `<section class="sec" aria-labelledby="g-${g}"><h2 id="g-${g}">${g}の数</h2><ul class="kz-list">${all.filter((m) => L.of(m).luck === g).map((m) => `<li><a href="${m}/"><b>${m}</b><span>${esc(L.of(m).keyword)}</span></a></li>`).join("")}</ul></section>`).join("\n")}
<section class="sec prose" aria-labelledby="g-how"><h2 id="g-how">数の見方</h2><p>姓名判断では、名前の字の画数から五格（天格・人格・地格・外格・総格）を出し、それぞれの数の吉凶を見ます。81をこえる数は、80を引いて考えます（82は2）。吉凶の区分は熊崎式の流れをくむ一般的なもので、流派によって一部の数の扱いが異なります。</p>
<p><a class="btn" href="../">名前を入れて五格を調べる</a></p></section>`;
  write("kazu", page({ path: "kazu/", title: "姓名判断の画数の意味一覧（1〜81）｜大吉・吉・凶がひと目でわかる｜なまえ帖", h1: "画数の意味（1〜81）",
    desc: "姓名判断で使う1〜81の数の吉凶とキーワードの一覧。大吉・吉・半吉・凶に分けて、数ごとの意味・性格・恋愛・生かし方を解説します。",
    crumbs: [{ name: "画数の意味", path: "kazu/" }], body }));
  urls.unshift("kazu/");
  return { urls };
}
