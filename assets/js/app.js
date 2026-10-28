/*
 * TOP：名前を入れる → 姓名判断（💮◎〇△）・五格・似ている偉人・シェア
 *   入力した名前は、この画面の中だけで計算する（どこにも送らない・保存しない）。
 *   結果のURL（?sei=…&mei=…）を共有できるようにする。
 */
(function (root) {
  "use strict";
  var N = root.Namae, S = N.seimei, C = N.core, L = N.luck, P = N.ijin.LIST;
  var ROLE = {
    ten: "家系から受けつぐ運。自分では変えにくいので、吉凶は重く見ません。",
    jin: "性格の中心と、仕事の運。五格の中でいちばん大切な数です。",
    chi: "子どものころから若いころの運と、家族や身近な人との縁。",
    gai: "まわりの人との関係や、外から受ける助け。",
    sou: "人生全体の流れと、年を重ねてからの運。"
  };
  var NAME = { ten: "天格", jin: "人格", chi: "地格", gai: "外格", sou: "総格" };

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === "text") e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }


  var SVGNS = "http://www.w3.org/2000/svg";
  function sv(tag, attrs, kids) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  var LUCKCOL = { "大吉": ["var(--pink)", "#fff"], "吉": ["var(--pink-soft)", "var(--pink-deep)"], "半吉": ["var(--lemon-soft)", "var(--ink)"], "凶": ["var(--soft)", "var(--muted)"] };
  /** 五格の図：名前の字をたてに並べ、どの字を足した数かをかっこで示す */
  function diagram(r) {
    var chars = r.sei.map(function (c) { return { c: c, part: 0 }; }).concat(r.mei.map(function (c) { return { c: c, part: 1 }; }));
    var RH = 56, TOP = 18, GAP = 16, W = 480, CX = 240;
    var ys = chars.map(function (x, i) { return TOP + RH / 2 + i * RH + (x.part ? GAP : 0); });
    var H = ys[ys.length - 1] + RH / 2 + TOP;
    var kids = [sv("title", {}, ["五格の図"])];
    chars.forEach(function (x, i) {
      kids.push(sv("text", { x: CX, y: ys[i] + 12, "text-anchor": "middle", "font-size": 40, "font-weight": 700, fill: "var(--ink)", "font-family": "var(--kanji)" }, [x.c.ch]));
      kids.push(sv("text", { x: CX + 30, y: ys[i] + 18, "font-size": 15, "font-weight": 700, fill: "var(--muted)" }, [String(x.c.strokes)]));
    });
    var ns = r.sei.length, last = chars.length - 1;
    function bracket(a, b, x, dir, key, label) {
      var y1 = ys[a] - 16, y2 = ys[b] + 16, t = 8 * dir;
      kids.push(sv("path", { d: "M" + (x - t) + "," + y1 + "H" + x + "V" + y2 + "H" + (x - t), fill: "none", stroke: "var(--line)", "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" }));
      var l = L.of(r[key].value), col = LUCKCOL[l.luck], w = 86, px = dir > 0 ? x + 6 : x - 6 - w, py = (y1 + y2) / 2 - 27;
      kids.push(sv("line", { x1: x, y1: (y1 + y2) / 2, x2: dir > 0 ? px : px + w, y2: (y1 + y2) / 2, stroke: "var(--line)", "stroke-width": 3 }));
      kids.push(sv("rect", { x: px, y: py, width: w, height: 54, rx: 16, fill: col[0], stroke: "var(--paper)", "stroke-width": 2 }));
      kids.push(sv("text", { x: px + w / 2, y: py + 23, "text-anchor": "middle", "font-size": 16, "font-weight": 700, fill: col[1] }, [label + " " + r[key].value]));
      kids.push(sv("text", { x: px + w / 2, y: py + 44, "text-anchor": "middle", "font-size": 16, "font-weight": 700, fill: col[1] }, [l.luck]));
    }
    bracket(0, ns - 1, 290, 1, "ten", "天格");
    bracket(ns, last, 290, 1, "chi", "地格");
    bracket(0, last, 390, 1, "sou", "総格");
    bracket(ns - 1, ns, 190, -1, "jin", "人格");
    bracket(0, last, 90, -1, "gai", "外格");
    return sv("svg", { viewBox: "0 0 " + W + " " + H, class: "gokaku-svg", role: "img", "aria-label": "五格の図：天格" + r.ten.value + "、人格" + r.jin.value + "、地格" + r.chi.value + "、外格" + r.gai.value + "、総格" + r.sou.value }, kids);
  }

  function render(box, sei, mei, r) {
    var rt = C.rate(r);
    box.textContent = "";
    var full = sei + mei;
    var key = rt.mark.key;
    var confetti = key === "hanamaru" || key === "nijuumaru"
      ? el("div", { class: "confetti", "aria-hidden": "true" }, Array.from({ length: 14 }, function (_, i) { return el("i", { style: "--i:" + i }); })) : null;
    var pct = Math.max(6, Math.min(100, Math.round(rt.score / 3 * 100)));
    var sec1 = el("section", { class: "sec res-card res-" + key, "aria-labelledby": "res-title" }, [
      confetti,
      el("p", { class: "res-name" }, [el("span", { text: full }), "さんの名前"]),
      el("div", { class: "verdict" }, [
        el("div", { class: "seal", role: "img", "aria-label": "評価：" + rt.mark.label, text: rt.mark.mark }),
        el("div", null, [
          el("h2", { id: "res-title", tabindex: "-1", text: rt.mark.label + "！" }),
          el("p", { text: rt.mark.text })
        ])
      ]),
      el("div", { class: "meter", role: "img", "aria-label": "名前のよさ：3点満点で" + rt.score + "点" }, [
        el("span", { class: "meter-bar" }, [el("span", { style: "width:" + pct + "%" })]),
        el("span", { class: "meter-scale", "aria-hidden": "true" }, [el("span", { text: "△" }), el("span", { text: "〇" }), el("span", { text: "◎" }), el("span", { text: "💮" })])
      ]),
      el("div", { class: "chars", "aria-label": "名前の字と画数" },
        r.sei.map(function (c) { return el("div", { class: "char" }, [el("b", { text: c.ch }), el("span", { text: c.strokes + "画" })]); })
          .concat([el("div", { class: "char is-sep", "aria-hidden": "true" })])
          .concat(r.mei.map(function (c) { return el("div", { class: "char" }, [el("b", { text: c.ch }), el("span", { text: c.strokes + "画" })]); })))
    ]);
    var kaku = el("ul", { class: "kaku" }, ["jin", "sou", "chi", "gai", "ten"].map(function (k) {
      var g = r[k], l = L.of(g.value);
      var stars = { "大吉": "★★★", "吉": "★★☆", "半吉": "★☆☆", "凶": "☆☆☆" }[l.luck];
      return el("li", { class: "k-" + k }, [el("b", { text: NAME[k] }), el("span", { class: "n", text: g.value + "画" }), el("span", { class: "luck l-" + l.luck, text: l.luck }),
        el("span", { class: "stars", "aria-hidden": "true", text: stars }),
        el("small", { text: l.keyword }), el("span", { class: "role", text: ROLE[k] })]);
    }));
    var s = r.sansai, IMI = N.kanjiImi || {};
    var table = el("table", { class: "ktable ctable" }, [
      el("thead", null, [el("tr", null, [el("th", { scope: "col", text: "字" }), el("th", { scope: "col", text: "画数" }), el("th", { scope: "col", text: "字の意味" })])]),
      el("tbody", null, r.sei.concat(r.mei).map(function (c) {
        var isK = /\p{Script=Han}/u.test(c.ch), imi = IMI[c.ch];
        return el("tr", null, [el("th", { scope: "row" }, [isK ? el("a", { class: "kbig-s", href: "kanji/" + encodeURIComponent(c.ch) + "/", text: c.ch }) : el("span", { class: "kbig-s", text: c.ch })]),
          el("td", { text: c.strokes + "画" }),
          el("td", null, [imi ? imi[0] : isK ? el("a", { href: "kanji/" + encodeURIComponent(c.ch) + "/", text: "読み方・意味を見る" }) : "かな文字"])]);
      }))
    ]);
    var secD = el("section", { class: "sec", "aria-labelledby": "zu-title" }, [
      el("h2", { id: "zu-title", text: "五格の図" }),
      el("div", { class: "gokaku" }, [diagram(r)]),
      el("p", { class: "note", text: "右の数字が1字ずつの画数です。かっこでくくった字の画数を足したものが、それぞれの格になります（姓や名が1字のときは「霊数」として1を足します）。" }),
      table
    ]);
    var sec2 = el("section", { class: "sec", "aria-labelledby": "kaku-title" }, [
      el("h2", { id: "kaku-title", text: "五格の画数と意味" }), kaku,
      el("p", { class: "note", text: "三才配置（天・人・地の五行）：" + s.ten + "→" + s.jin + "→" + s.chi + "（天と人は" + s.tenJin.type + "、人と地は" + s.jinChi.type + "）" })
    ]);
    var sims = C.similar(r, P, S.calculateSeimei, 3);
    var sec3 = el("section", { class: "sec", "aria-labelledby": "sim-title" }, [
      el("h2", { id: "sim-title", text: sims.length ? "あなたの名前に似ている偉人" : "似ている偉人" }),
      sims.length ? el("ul", { class: "sim" }, sims.map(function (x) {
        return el("li", null, [el("a", { href: "ijin/" + x.person.slug + "/" }, [
          el("span", { class: "lv", text: x.level.label }), el("span", { class: "nm", text: x.person.sei + " " + x.person.mei }),
          el("small", { text: x.why + "。" + x.person.about })])]);
      })) : el("p", { text: "今回は、画数の型が近い偉人は見つかりませんでした。偉人の一覧から、気になる人の名前も見てみてください。" }),
      el("p", { class: "note", text: "画数の型（人格・総格・三才配置）が近い人を表示しています。性格や人生が同じという意味ではありません。" })
    ]);
    var url = root.location.origin + root.location.pathname + "?sei=" + encodeURIComponent(sei) + "&mei=" + encodeURIComponent(mei);
    var text = "【なまえ帖】" + full + "の姓名判断は「" + rt.mark.mark + " " + rt.mark.label + "」" + (sims[0] ? "。" + sims[0].person.sei + sims[0].person.mei + "と" + sims[0].level.label + "名前でした" : "でした");
    var copy = el("button", { type: "button", text: "リンクをコピー" });
    copy.addEventListener("click", function () {
      try { navigator.clipboard.writeText(url).then(function () { copy.textContent = "コピーしました"; }, function () { copy.textContent = "コピーできませんでした"; }); } catch (e) { copy.textContent = "コピーできませんでした"; }
    });
    var sec4 = el("section", { class: "sec", "aria-labelledby": "share-title" }, [
      el("h2", { id: "share-title", text: "結果をシェアする" }),
      el("div", { class: "share" }, [
        el("a", { class: "s-line", href: "https://line.me/R/share?text=" + encodeURIComponent(text + "\n" + url), target: "_blank", rel: "noopener", text: "LINEで送る" }),
        el("a", { class: "s-x", href: "https://x.com/intent/post?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url), target: "_blank", rel: "noopener", text: "Xでポスト" }),
        copy
      ])
    ]);
    var sec5 = el("section", { class: "sec ak-promo", "aria-labelledby": "promo-title" }, [
      el("h2", { id: "promo-title", text: "赤ちゃんの名前をさがしている方へ" }),
      el("ul", { class: "plist ak-ways" }, [
        el("li", null, [el("a", { href: "akachan/" }, [el("b", { text: "💮 名字に合う名前" }), el("span", { text: sei + "さんに合う、評価のよい名前をずらっと表示。" })])]),
        el("li", null, [el("a", { href: "kanji/yomi/" + encodeURIComponent("はる") + "/" }, [el("b", { text: "🔤 響きからさがす" }), el("span", { text: "好きな読みの漢字を一覧で。" })])]),
        el("li", null, [el("a", { href: "nazuke/" }, [el("b", { text: "♥ 候補をくらべる" }), el("span", { text: "気になる名前を並べてくらべる。" })])])
      ])
    ]);
    [sec1, secD, sec2, sec3, sec4, sec5].forEach(function (x) { box.appendChild(x); });
    box.hidden = false;
    var h = document.getElementById("res-title");
    box.scrollIntoView({ behavior: "smooth", block: "start" });
    if (h) h.focus({ preventScroll: true });
  }

  function run(form, box, err, push) {
    var sei = form.sei.value.trim(), mei = form.mei.value.trim();
    err.hidden = true;
    if (!sei || !mei) { err.textContent = "姓と名の両方を入れてください。"; err.hidden = false; (sei ? form.mei : form.sei).focus(); return; }
    var r = S.calculateSeimei({ sei: sei, mei: mei });
    if (!r || !r.ok) {
      err.textContent = "画数がわからない文字がふくまれています。漢字・ひらがな・カタカナで入れてください。";
      err.hidden = false; form.sei.focus(); return;
    }
    // アドレス欄には名前を入れない（アクセス解析に名前が送られないように）。シェア用のリンクは結果の中で作る
    render(box, sei, mei, r);
  }

  function init() {
    var form = document.getElementById("name-form"), box = document.getElementById("result"), err = document.getElementById("name-err");
    if (!form) return;
    form.addEventListener("submit", function (e) { e.preventDefault(); run(form, box, err, true); });
    var q = new URLSearchParams(root.location.search);
    if (q.get("sei") && q.get("mei")) { form.sei.value = q.get("sei").slice(0, 10); form.mei.value = q.get("mei").slice(0, 10); run(form, box, err, false); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof self !== "undefined" ? self : this);
