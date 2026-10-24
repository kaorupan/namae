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
    var s = r.sansai;
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
    [sec1, sec2, sec3, sec4].forEach(function (x) { box.appendChild(x); });
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
    if (push) try { root.history.replaceState(null, "", "?sei=" + encodeURIComponent(sei) + "&mei=" + encodeURIComponent(mei)); } catch (e) {}
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
