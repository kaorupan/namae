/*
 * 赤ちゃんの名前さがし（/akachan/）
 *   姓と条件（性別・文字数・評価・響き・好きな漢字）を入れる → 名前の候補を、姓名判断の評価がよい順にずらっと出す。
 *   ♥で「名づけ候補くらべ」に入れられる（この端末のブラウザにだけ保存）。入力はどこにも送らない。
 */
(function (root) {
  "use strict";
  var N = root.Namae, S = N.seimei, C = N.core, L = N.luck;
  var KEY = "namae-nazuke-v1", STEP = 30;
  var RANK = { hanamaru: 0, nijuumaru: 1, maru: 2, sankaku: 3 };
  var MIN = { hana: 0, niju: 1, maru: 2, all: 3 };
  var G = { m: "男の子", f: "女の子", u: "男女どちらも" };
  // 同じ表記は1つにまとめる（読みと性別をあわせる）
  var NAMES = (function () {
    var m = new Map();
    N.names.forEach(function (x) {
      var o = m.get(x[0]) || { mei: x[0], items: [] };
      o.items.push({ y: x[1], g: x[2] }); m.set(x[0], o);
    });
    return Array.from(m.values());
  })();

  function store() { try { return JSON.parse(localStorage.getItem(KEY) || "null") || { sei: "", list: [], sort: "score" }; } catch (e) { return { sei: "", list: [], sort: "score" }; } }
  function put(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === "text") e.textContent = attrs[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  var kata2hira = function (s) { return s.replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); }); };

  function search(q) {
    var out = [];
    NAMES.forEach(function (n) {
      var items = n.items.filter(function (it) { return (q.g === "all" || it.g === q.g || it.g === "u") && (!q.oto || it.y.indexOf(q.oto) === 0); });
      if (!items.length) return;
      var len = Array.from(n.mei).length;
      if (q.len && (q.len === 3 ? len < 3 : len !== q.len)) return;
      if (q.kanji && n.mei.indexOf(q.kanji) < 0) return;
      var r = S.calculateSeimei({ sei: q.sei, mei: n.mei });
      if (!r || !r.ok) return;
      var rt = C.rate(r);
      if (RANK[rt.mark.key] > MIN[q.min]) return;
      var yomi = [], gs = {};
      items.forEach(function (it) { if (yomi.indexOf(it.y) < 0) yomi.push(it.y); gs[it.g] = true; });
      out.push({ n: { mei: n.mei, yomi: yomi, g: gs }, r: r, rt: rt });
    });
    out.sort(function (a, b) { return RANK[a.rt.mark.key] - RANK[b.rt.mark.key] || b.rt.score - a.rt.score || a.n.yomi[0].localeCompare(b.n.yomi[0], "ja"); });
    return out;
  }

  function card(x, i, sei) {
    var s = store(), inList = s.list.some(function (c) { return c.mei === x.n.mei; });
    var g = function (k, label) { var l = L.of(x.r[k].value); return el("span", { class: "nz-g l-" + l.luck }, [label + " " + x.r[k].value, el("em", { text: l.luck })]); };
    var fav = el("button", { type: "button", class: "nz-fav" + (inList ? " is-on" : ""), "aria-pressed": inList ? "true" : "false", "aria-label": x.n.mei + "を名づけ候補に入れる", text: inList ? "♥" : "♡" });
    fav.addEventListener("click", function () {
      var v = store(); v.sei = sei;
      var at = -1; v.list.forEach(function (c, j) { if (c.mei === x.n.mei) at = j; });
      if (at >= 0) v.list.splice(at, 1); else if (v.list.length < 60) v.list.push({ mei: x.n.mei, fav: true, yomi: x.n.yomi[0] || "" });
      put(v); var on = at < 0; fav.classList.toggle("is-on", on); fav.textContent = on ? "♥" : "♡"; fav.setAttribute("aria-pressed", on ? "true" : "false");
      updateCount();
    });
    var gs = Object.keys(x.n.g).map(function (k) { return G[k]; }).join("・");
    return el("li", { class: "nz-item ak-item res-" + x.rt.mark.key }, [
      el("span", { class: "nz-rank", text: String(i + 1) }),
      el("span", { class: "nz-mark", role: "img", "aria-label": x.rt.mark.label, text: x.rt.mark.mark }),
      el("div", { class: "nz-body" }, [
        el("a", { class: "nz-name", href: "../?sei=" + encodeURIComponent(sei) + "&mei=" + encodeURIComponent(x.n.mei) }, [el("span", { class: "nz-sei", text: sei }), x.n.mei]),
        el("span", { class: "ak-yomi", text: x.n.yomi.join("・") + "　" + gs }),
        el("div", { class: "nz-gs" }, [g("jin", "人格"), g("sou", "総格"), g("chi", "地格"), g("gai", "外格")])
      ]), fav]);
  }

  function updateCount() {
    var n = store().list.length, a = document.getElementById("ak-mylist");
    if (a) a.textContent = "♥ 名づけ候補くらべ（" + n + "件）を見る →";
  }

  function init() {
    var form = document.getElementById("ak-form");
    if (!form) return;
    var box = document.getElementById("ak-result"), list = document.getElementById("ak-list"), more = document.getElementById("ak-more"), sum = document.getElementById("ak-sum"), err = document.getElementById("ak-err");
    var saved = store(); if (saved.sei) form.sei.value = saved.sei;
    updateCount();
    var rows = [], shown = 0, sei = "";
    function show() {
      rows.slice(shown, shown + STEP).forEach(function (x, j) { list.appendChild(card(x, shown + j, sei)); });
      shown = Math.min(rows.length, shown + STEP);
      more.hidden = shown >= rows.length;
      more.textContent = "もっと見る（あと" + (rows.length - shown) + "件）";
    }
    more.addEventListener("click", show);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err.hidden = true;
      sei = form.sei.value.trim().slice(0, 6);
      if (!sei) { err.textContent = "姓（名字）を入れてください。"; err.hidden = false; form.sei.focus(); return; }
      var chk = S.calculateSeimei({ sei: sei, mei: "一" });
      if (!chk || !chk.ok) { err.textContent = "姓に、画数がわからない文字がふくまれています。"; err.hidden = false; form.sei.focus(); return; }
      var v = store(); v.sei = sei; put(v);
      var q = { sei: sei, g: (form.querySelector("[name=g]:checked") || {}).value || "all", len: +form.len.value || 0, min: form.min.value,
        oto: kata2hira(form.oto.value.trim()), kanji: Array.from(form.kanji.value.trim())[0] || "" };
      rows = search(q); shown = 0; list.textContent = "";
      var c = { hanamaru: 0, nijuumaru: 0, maru: 0, sankaku: 0 }; rows.forEach(function (x) { c[x.rt.mark.key]++; });
      sum.textContent = "";
      sum.appendChild(el("p", { class: "ak-sum-main" }, [el("b", { text: sei }), "さんに合う名前が ", el("strong", { text: rows.length + "件" }), " 見つかりました"]));
      sum.appendChild(el("ul", { class: "ak-sum-marks", "aria-label": "評価ごとの件数" }, [["💮", c.hanamaru], ["◎", c.nijuumaru], ["〇", c.maru], ["△", c.sankaku]]
        .filter(function (m) { return m[1]; }).map(function (m) { return el("li", null, [el("b", { text: m[0] }), m[1] + "件"]); })));
      if (!rows.length) list.appendChild(el("li", { class: "nz-empty", text: "条件に合う名前が見つかりませんでした。評価や響きの条件をゆるめてみてください。" }));
      else show();
      box.hidden = false;
      var h = document.getElementById("ak-title"); box.scrollIntoView({ behavior: "smooth", block: "start" }); if (h) h.focus({ preventScroll: true });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof self !== "undefined" ? self : this);
