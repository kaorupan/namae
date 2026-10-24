/*
 * 姓名判断 エンジン（計算のみ・DOM操作なし・文章なし）
 *
 * ■ えみりが採用する方式（流派で差が出る点を明文化）
 *   1. 画数：今の字形（新字体・入力された字のまま）で数える。旧字体に直して数える方式（康熙字典式）はとらない。
 *      漢字の画数は MJ文字情報一覧表の総画数（content/seimei-strokes.js）。互換漢字（神・﨑など）はその字形の画数。
 *   2. かな：ひらがな・カタカナは下の表の画数。濁点「゛」は＋2、半濁点「゜」は＋1。小さい字は大きい字と同じ。
 *      長音「ー」は1画。
 *   3. 繰り返し記号「々」「ゝ」「ゞ」「ヽ」「ヾ」：直前の字と同じ画数（濁点つきは＋2）として数える。
 *   4. 五格（熊崎式の流れをくむ一般的な数え方）
 *      天格＝姓の画数の合計　　人格＝姓の最後の字＋名の最初の字　　地格＝名の画数の合計
 *      総格＝姓名すべての画数の合計　　外格＝天格＋地格−人格
 *      姓または名が1字のときは「霊数1」を足して天格・地格・外格を出す（総格・人格には足さない）。
 *   5. 吉凶：1〜81の数で見る。82以上は80を引いた数（81で1に戻る）。
 *   6. 三才配置：天格・人格・地格の下1桁を五行に当てる（1・2＝木、3・4＝火、5・6＝土、7・8＝金、9・0＝水）。
 *      天→人、人→地の五行の関係（相生・比和・相剋）を見る。
 *   7. 相性：ふたりの人格どうし（ふだんの性格）と総格どうし（人生の方向性）の五行の関係を見る。
 *
 * 文字の扱い：入力はコードポイント単位で読む（𠮷 などサロゲートペアも1字）。互換漢字を残すため、
 * 漢字には Unicode 正規化をかけない（かなだけ NFD で濁点を分ける）。
 *
 * ブラウザでは window.KaruteEngines.seimei、Node では module.exports で使える。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./seimei-strokes.js"));
  } else {
    root.Namae = root.Namae || {};
    root.Namae.seimei = factory(root.Namae.strokes);
  }
})(typeof self !== "undefined" ? self : this, function (strokesTable) {
  "use strict";

  // かなの画数（清音・小字。濁点・半濁点は NFD で分けて足す）
  var KANA = {};
  function addKana(list) {
    Object.keys(list).forEach(function (n) {
      Array.from(list[n]).forEach(function (c) { KANA[c] = Number(n); });
    });
  }
  addKana({ // ひらがな（小さい字を含む）
    1: "くしそつてのひへるろんっ",
    2: "いうえこすちとぬねみめゆよらりれわゐぃぅぇゅょゎ",
    3: "あおかけさせにはまむもやをゑぁぉゃ",
    4: "きたなふほ"
  });
  addKana({ // カタカナ（小さい字を含む）
    1: "ノフヘレー",
    2: "アイカクコスセソトナニヌハヒマムメヤユラリルワンァィヵャュヮ",
    3: "ウエオキケサシタチツテミモヨロヲヱゥェォヶッョ",
    4: "ネホヰ"
  });
  var DAKUTEN = "゙", HANDAKUTEN = "゚";
  var REPEAT = { "々": 0, "ゝ": 0, "ゞ": 2, "ヽ": 0, "ヾ": 2, "〻": 0 };

  var ELEMENTS = ["水", "木", "木", "火", "火", "土", "土", "金", "金", "水"]; // 下1桁 → 五行
  var GEN = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };   // 相生：左が右を生む
  var KOKU = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };  // 相剋：左が右を剋す

  function luckOf(n) {
    var L = [null,
      "大吉", "凶", "大吉", "凶", "大吉", "大吉", "吉", "吉", "凶", "凶",
      "大吉", "凶", "大吉", "凶", "大吉", "大吉", "吉", "吉", "凶", "凶",
      "大吉", "凶", "大吉", "大吉", "吉", "凶", "半吉", "凶", "吉", "半吉",
      "大吉", "大吉", "大吉", "凶", "吉", "凶", "吉", "半吉", "大吉", "凶",
      "大吉", "凶", "凶", "凶", "大吉", "凶", "大吉", "吉", "凶", "凶",
      "半吉", "吉", "凶", "凶", "半吉", "凶", "吉", "半吉", "凶", "凶",
      "吉", "凶", "吉", "凶", "吉", "凶", "吉", "吉", "凶", "凶",
      "半吉", "凶", "半吉", "凶", "半吉", "凶", "半吉", "半吉", "凶", "凶",
      "大吉"];
    return L[wrap(n)];
  }
  function wrap(n) { var v = n; while (v > 81) v -= 80; return v; }
  function elementOf(n) { return ELEMENTS[n % 10]; }

  // a から見た b の関係
  function relation(a, b) {
    if (a === b) return { type: "比和", good: true, dir: "same" };
    if (GEN[a] === b) return { type: "相生", good: true, dir: "give" };    // a が b を生む
    if (GEN[b] === a) return { type: "相生", good: true, dir: "receive" }; // b が a を生む
    if (KOKU[a] === b) return { type: "相剋", good: false, dir: "press" }; // a が b を剋す
    return { type: "相剋", good: false, dir: "pressed" };                  // b が a を剋す
  }

  function isKana(c) { return /[ぁ-ゖゝゞァ-ヺー-ヾ]/.test(c); }

  // 1字ずつ画数を出す。わからない字は strokes:null
  function charStrokes(chars) {
    var out = [];
    for (var i = 0; i < chars.length; i++) {
      var c = chars[i], n = null, kind = "kanji";
      if (Object.prototype.hasOwnProperty.call(REPEAT, c)) {
        kind = "repeat";
        n = out.length && out[out.length - 1].strokes != null ? out[out.length - 1].strokes + REPEAT[c] : null;
      } else if (isKana(c)) {
        kind = "kana";
        var d = Array.from(c.normalize("NFD"));
        n = KANA[d[0]] || null;
        if (n != null) for (var j = 1; j < d.length; j++) n += d[j] === DAKUTEN ? 2 : d[j] === HANDAKUTEN ? 1 : 0;
      } else {
        n = strokesTable.strokesOf(c);
      }
      out.push({ ch: c, strokes: n, kind: kind });
    }
    return out;
  }

  function clean(s) { return Array.from(String(s == null ? "" : s).replace(/[\s　・･]/g, "")); }

  function validate(sei, mei) {
    var errors = [];
    if (!sei.length) errors.push({ field: "sei", code: "empty" });
    else if (sei.length > 5) errors.push({ field: "sei", code: "long" });
    if (!mei.length) errors.push({ field: "mei", code: "empty" });
    else if (mei.length > 8) errors.push({ field: "mei", code: "long" });
    return errors;
  }

  function kaku(value, rei) {
    return { value: value, rei: !!rei, n: wrap(value), luck: luckOf(value), element: elementOf(value) };
  }

  /*
   * calculateSeimei({ sei:"山田", mei:"花子" })
   *  → { ok:true, sei:[{ch,strokes,kind}], mei:[…], ten, jin, chi, gai, sou, sansai, score }
   *  → { ok:false, errors:[{field,code}], unknown:[字…] }（空欄・長すぎ・画数がわからない字）
   */
  function calculateSeimei(input) {
    var seiChars = clean(input && input.sei), meiChars = clean(input && input.mei);
    var errors = validate(seiChars, meiChars);
    if (errors.length) return { ok: false, errors: errors, unknown: [] };
    var sei = charStrokes(seiChars), mei = charStrokes(meiChars);
    var unknown = sei.concat(mei).filter(function (x) { return x.strokes == null; }).map(function (x) { return x.ch; });
    if (unknown.length) return { ok: false, errors: [{ field: "name", code: "unknown" }], unknown: unknown };

    function sum(a) { return a.reduce(function (t, x) { return t + x.strokes; }, 0); }
    var seiSum = sum(sei), meiSum = sum(mei);
    var reiSei = sei.length === 1, reiMei = mei.length === 1;
    var tenV = seiSum + (reiSei ? 1 : 0);
    var chiV = meiSum + (reiMei ? 1 : 0);
    var jinV = sei[sei.length - 1].strokes + mei[0].strokes;
    var souV = seiSum + meiSum;
    var gaiV = tenV + chiV - jinV;

    var ten = kaku(tenV, reiSei), jin = kaku(jinV, false), chi = kaku(chiV, reiMei), sou = kaku(souV, false), gai = kaku(gaiV, reiSei || reiMei);
    var tj = relation(ten.element, jin.element), jc = relation(jin.element, chi.element);
    var sansai = {
      ten: ten.element, jin: jin.element, chi: chi.element,
      tenJin: tj, jinChi: jc,
      level: tj.good && jc.good ? "good" : (!tj.good && !jc.good ? "caution" : "mixed")
    };
    // 総合点（えみり独自の目安）：人格・総格を重く、地格・外格を中くらい、天格は軽く見る
    var P = { "大吉": 1, "吉": 0.75, "半吉": 0.45, "凶": 0.15 };
    var raw = P[jin.luck] * 30 + P[sou.luck] * 30 + P[chi.luck] * 15 + P[gai.luck] * 15 +
      (sansai.level === "good" ? 10 : sansai.level === "mixed" ? 6 : 2);
    var score = Math.round(raw);
    return {
      ok: true, sei: sei, mei: mei, seiText: seiChars.join(""), meiText: meiChars.join(""),
      ten: ten, jin: jin, chi: chi, gai: gai, sou: sou, sansai: sansai, score: score
    };
  }

  /*
   * calculateSeimeiCompatibility(a, b)：a・b は calculateSeimei の結果（ok:true）
   *  人格どうし・総格どうしの五行の関係と、目安の点数
   */
  function calculateSeimeiCompatibility(a, b) {
    var jin = relation(a.jin.element, b.jin.element);
    var sou = relation(a.sou.element, b.sou.element);
    function pts(r) { return r.type === "相生" ? 40 : r.type === "比和" ? 32 : 18; }
    var score = Math.round(pts(jin) + pts(sou) * 0.75 + (a.jin.n === b.jin.n ? 10 : 0) + (a.sou.luck !== "凶" && b.sou.luck !== "凶" ? 10 : 5));
    if (score > 100) score = 100;
    return { you: a, partner: b, jin: jin, sou: sou, sameJin: a.jin.n === b.jin.n, score: score };
  }

  return {
    calculateSeimei: calculateSeimei,
    calculateSeimeiCompatibility: calculateSeimeiCompatibility,
    charStrokes: function (s) { return charStrokes(Array.from(String(s))); },
    luckOf: luckOf, wrap: wrap, elementOf: elementOf, relation: relation,
    KANA: KANA
  };
});
