// 画数の意味（1〜81）のページ：kazu/ と kazu/<数>/
//   「姓名判断 24画」「総格 31 意味」などで探す人向け。数の吉凶とキーワードは luck.js、文章は data/kazu.mjs。
import KAZU from "../data/kazu.mjs";

const LUCK_ORDER = ["大吉", "吉", "半吉", "凶"];
// 格ごとの読み方（吉凶ごとに書いた文に、その数のキーワードを入れる）
const KAKU = {
  jin: { name: "人格", role: "性格の中心と仕事の運", text: {
    "大吉": (w) => `性格の中心に「${w}」の力がよい形で出やすく、仕事でも持ち味を発揮しやすい配置です。五格の中でいちばん大切な格なので、名前全体の評価も高くなりやすくなります。`,
    "吉": (w) => `性格の中心に「${w}」の性質が表れ、努力が実を結びやすい配置です。持ち味を意識して伸ばすと、仕事でも評価されやすくなります。`,
    "半吉": (w) => `「${w}」のよい面と気をつけたい面の両方が、性格に出やすい配置です。よい面を意識して使うと、強みとして生かせます。`,
    "凶": (w) => `「${w}」の性質が性格に強めに出やすい配置です。気をつけたい点を知っておけば、ほかの格とのバランスで十分に補えます。` } },
  chi: { name: "地格", role: "子どものころから若いころの運と、家族との縁", text: {
    "大吉": (w) => `若いころから「${w}」のよさが出やすく、家族や身近な人との縁にも恵まれやすい配置です。名だけの画数で決まるので、名づけで調整しやすい格です。`,
    "吉": (w) => `若いころの土台に「${w}」の性質が表れ、身近な人に支えられながら伸びていく配置です。`,
    "半吉": (w) => `若いころに「${w}」の波を感じやすい配置です。家族とのコミュニケーションを大切にすると安定します。`,
    "凶": (w) => `若いころに「${w}」の面が出やすい配置です。地格は名の字だけで決まるので、名づけのときは別の字や画数も比べてみると安心です。` } },
  sou: { name: "総格", role: "人生全体の流れと、年を重ねてからの運", text: {
    "大吉": (w) => `人生全体を「${w}」の力が後押しする配置です。とくに年齢を重ねてから、その意味がはっきり表れるとされます。`,
    "吉": (w) => `人生全体に「${w}」の性質が表れ、続けた努力が後半に実りやすい配置です。`,
    "半吉": (w) => `人生の流れに「${w}」の波が出やすい配置です。よい時期に備えをしておくと、後半が安定します。`,
    "凶": (w) => `人生の流れに「${w}」の面が出やすいとされる配置です。人格や三才配置がよければ、全体としてのバランスは十分にとれます。` } },
  gai: { name: "外格", role: "まわりの人との関係や外からの助け", text: {
    "大吉": (w) => `まわりの人との関係に「${w}」のよさが出やすく、人からの助けや引き立てに恵まれやすい配置です。`,
    "吉": (w) => `人間関係に「${w}」の性質が表れ、信頼を積み重ねるほど助けが集まる配置です。`,
    "半吉": (w) => `人間関係で「${w}」のよい面と難しい面の両方が出やすい配置です。相手との距離感を大切にすると安定します。`,
    "凶": (w) => `人間関係で「${w}」の面が出やすい配置です。こまめな言葉かけを意識すると、関係がおだやかになります。` } }
};
// 計算例に使う、よくある名字
const SURNAMES = ["佐藤", "鈴木", "高橋", "田中", "伊藤", "渡辺", "山本", "中村", "小林", "加藤", "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "斎藤", "清水"];
// 一部の流派で「女性には強すぎる」とされてきた数（現在は気にしない考え方も多い）
const STRONG = new Set([21, 23, 29, 33, 39]);

export function buildKazu({ page, write, esc, L, people, kanjiStrokes, S, NAMES }) {
  const urls = [];
  const meis = [...new Set(NAMES.map((x) => x.mei))].filter((m) => /^\p{Script=Han}+$/u.test(m));
  const cache = new Map();
  const calc = (sei, mei) => { const k = sei + "|" + mei; if (!cache.has(k)) cache.set(k, S.calculateSeimei({ sei, mei })); return cache.get(k); };
  function example(n, key) {
    for (const sei of SURNAMES) for (const mei of meis) { const r = calc(sei, mei); if (r.ok && r[key].value === n) return { sei, mei, r }; }
    return null;
  }
  const strokesOf = (cs) => cs.map((c) => `「${c.ch}」${c.strokes}画`).join("＋");
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
<section class="sec prose" aria-labelledby="k3"><h2 id="k3">格ごとの${n}画の読み方</h2>
<p>姓名判断では、同じ${n}画でも、五格のどこにあるかで意味が変わります。とくに大切なのは、性格の中心をあらわす<b>人格</b>と、人生全体の流れをあらわす<b>総格</b>です。家系から受けつぐ天格の吉凶は、重く見ないのが一般的です。</p>
${["jin", "chi", "sou", "gai"].map((key) => `<h3>${KAKU[key].name}が${n}画のとき</h3><p class="kz-role">${KAKU[key].role}</p><p>${esc(KAKU[key].text[l.luck](l.keyword))}</p>`).join("\n")}
</section>
${(() => {
  const ex = [["jin", "人格"], ["sou", "総格"], ["chi", "地格"]].map(([key, name]) => [key, name, example(n, key)]).filter((x) => x[2]);
  if (!ex.length) return "";
  return `<section class="sec prose" aria-labelledby="k3b"><h2 id="k3b">計算の例</h2>
<p>実際の名前の例で、${n}画になる計算のしかたを見てみましょう（新字体で数えています）。</p>
${ex.map(([key, name, e]) => {
    const r = e.r, lastSei = r.sei[r.sei.length - 1], firstMei = r.mei[0];
    const how = key === "jin" ? `姓の最後の字と名の最初の字を足します。${strokesOf([lastSei, firstMei])}＝<b>${r.jin.value}画</b>`
      : key === "chi" ? `名の字をすべて足します。${strokesOf(r.mei)}${r.mei.length === 1 ? "＋霊数1" : ""}＝<b>${r.chi.value}画</b>`
      : `姓と名の字をすべて足します。${strokesOf(r.sei.concat(r.mei))}＝<b>${r.sou.value}画</b>`;
    return `<h3>${name}が${n}画になる例：${esc(e.sei)} ${esc(e.mei)}さん</h3><p>${how}</p><p class="note"><a href="../../?sei=${encodeURIComponent(e.sei)}&amp;mei=${encodeURIComponent(e.mei)}">${esc(e.sei + e.mei)}さんの五格をすべて見る →</a></p>`;
  }).join("\n")}
</section>`;
})()}
<section class="sec prose" aria-labelledby="k3c"><h2 id="k3c">流派による違い</h2>
<p>姓名判断には流派があり、同じ名前でも結果が変わることがあります。おもな違いは次の3つです。</p>
<ul>
<li><b>画数の数え方</b>：このサイトは、ふだん使う新字体で数えます。旧字体（たとえば「沢」を「澤」として17画）で数える流派では、${n}画にならないこともあります。</li>
<li><b>霊数</b>：姓や名が1字のとき、1を足して計算する方法（このサイトはこの方法）と、足さない方法があります。</li>
<li><b>数の吉凶</b>：${l.luck === "半吉" ? `${n}画は、流派によって吉とも凶とも分けられる「半吉」の数です。` : `${n}画を${l.luck}とする見方は一般的ですが、一部の数は流派によって分け方が異なります。`}</li>
</ul>
${STRONG.has(n) ? `<p>なお、${n}画は運勢が強い数のため、一部の流派では「女性の名前には強すぎる」とされてきました。現在は、性別で分けて考えない見方も多くあります。</p>` : ""}
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
