/*
 * 名前の評価（💮◎〇△）と「似ている偉人」
 *   評価：五格の吉凶を点にして重みをつけて合計し、三才配置（天・人・地の五行の流れ）を加える。
 *     人格（性格の中心）35％・総格（人生全体）30％・地格（若いころ・土台）15％・外格（人との縁）10％・三才配置10％
 *     大吉3点・吉2点・半吉1点・凶0点。三才配置は、両方よい3点・片方1.5点・両方よくない0点。
 *     2.5以上💮 ／ 1.9以上◎ ／ 1.2以上〇 ／ それ未満△（×は使わない。名前に悪い印はつけない）
 *   似ている偉人：人格と総格が同じ＝そっくり／どちらかが同じ＝よく似ている／三才配置の五行が同じ＝ちょっと似ている
 *
 * ブラウザでは window.Namae.core、Node では module.exports。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.Namae = root.Namae || {};
  root.Namae.core = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var PT = { "大吉": 3, "吉": 2, "半吉": 1, "凶": 0 };
  var MARKS = [
    { min: 2.5, mark: "💮", key: "hanamaru", label: "とてもよい名前", text: "五格の多くが吉数で、名前の流れもよい、とても恵まれた画数です。" },
    { min: 1.9, mark: "◎", key: "nijuumaru", label: "よい名前", text: "大切な格に吉数がそろった、バランスのよい画数です。" },
    { min: 1.2, mark: "〇", key: "maru", label: "まずまずの名前", text: "よい数と気をつけたい数がまじった画数です。強みを知って生かすと、名前の力が発揮されます。" },
    { min: 0, mark: "△", key: "sankaku", label: "ひと工夫で生きる名前", text: "気をつけたい数が多めの画数です。画数がすべてではありません。あなたらしい強みを大切にしてください。" }
  ];
  var LEVELS = [
    { key: "same", label: "そっくり", why: "人格と総格が同じ" },
    { key: "close", label: "よく似ている", why: "" },
    { key: "light", label: "ちょっと似ている", why: "三才配置（天・人・地の五行）が同じ" }
  ];

  function rate(r) {
    var s = r.sansai || {};
    var sansai = (s.tenJin && s.tenJin.good ? 1.5 : 0) + (s.jinChi && s.jinChi.good ? 1.5 : 0);
    var score = PT[r.jin.luck] * 0.35 + PT[r.sou.luck] * 0.30 + PT[r.chi.luck] * 0.15 + PT[r.gai.luck] * 0.10 + sansai * 0.10;
    for (var i = 0; i < MARKS.length; i++) if (score >= MARKS[i].min - 1e-9) return { score: Math.round(score * 100) / 100, mark: MARKS[i] };
    return { score: score, mark: MARKS[MARKS.length - 1] };
  }

  /** 似ている偉人（同じ偉人は1回だけ・近い順に max 人） */
  function similar(r, people, calc, max) {
    var out = [];
    people.forEach(function (p) {
      var q = calc({ sei: p.sei, mei: p.mei });
      if (!q || !q.ok) return;
      var sameJin = q.jin.value === r.jin.value, sameSou = q.sou.value === r.sou.value;
      var sameSansai = r.sansai && q.sansai && r.sansai.ten === q.sansai.ten && r.sansai.jin === q.sansai.jin && r.sansai.chi === q.sansai.chi;
      var lv = sameJin && sameSou ? 0 : (sameJin || sameSou) ? 1 : sameSansai ? 2 : -1;
      if (lv < 0) return;
      var why = lv === 0 ? "人格（" + q.jin.value + "画）と総格（" + q.sou.value + "画）が同じ"
        : lv === 1 ? (sameJin ? "人格が同じ" + q.jin.value + "画" : "総格が同じ" + q.sou.value + "画")
        : "三才配置が同じ（" + q.sansai.ten + "・" + q.sansai.jin + "・" + q.sansai.chi + "）";
      out.push({ person: p, level: LEVELS[lv], rank: lv, why: why });
    });
    out.sort(function (a, b) { return a.rank - b.rank || (a.person.born || a.person.died) - (b.person.born || b.person.died); });
    return out.slice(0, max || 3);
  }

  return { rate: rate, similar: similar, MARKS: MARKS, LEVELS: LEVELS };
});
