/*
 * 名づけ候補くらべ（/nazuke/）
 *   姓を1回入れて、名前の候補をいくつでも追加 → 💮◎〇△の評価順に並べてくらべる。
 *   候補はこの端末のブラウザにだけ保存する（サーバーには送らない）。
 */
(function (root) {
  "use strict";
  var N = root.Namae, S = N.seimei, C = N.core, L = N.luck, P = N.ijin.LIST;
  var KEY = "namae-nazuke-v1", MAX = 60;
  var ORDER = { hanamaru: 0, nijuumaru: 1, maru: 2, sankaku: 3 };
  var state = { sei: "", list: [], sort: "score" };

  function load() { try { var v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v && Array.isArray(v.list)) state = { sei: v.sei || "", list: v.list.slice(0, MAX), sort: v.sort || "score" }; } catch (e) {} }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === "text") e.textContent = attrs[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function split(text) { return text.split(/[\s、,，・\/／]+/).map(function (s) { return s.trim(); }).filter(Boolean); }

  function evaluate(mei) {
    var r = S.calculateSeimei({ sei: state.sei, mei: mei });
    if (!r || !r.ok) return null;
    var rt = C.rate(r), sim = C.similar(r, P, S.calculateSeimei, 1)[0];
    return { r: r, rt: rt, sim: sim };
  }

  function render() {
    var box = document.getElementById("nz-list"), info = document.getElementById("nz-count");
    box.textContent = "";
    var rows = state.list.map(function (c, i) { return { c: c, i: i, v: state.sei ? evaluate(c.mei) : null }; });
    if (state.sort === "score") rows.sort(function (a, b) {
      if (!a.v || !b.v) return (a.v ? -1 : 1) - (b.v ? -1 : 1) || a.i - b.i;
      return ORDER[a.v.rt.mark.key] - ORDER[b.v.rt.mark.key] || b.v.rt.score - a.v.rt.score || a.i - b.i;
    });
    if (state.sort === "fav") rows.sort(function (a, b) { return (b.c.fav ? 1 : 0) - (a.c.fav ? 1 : 0) || a.i - b.i; });
    info.textContent = state.list.length ? "候補 " + state.list.length + " 件" + (state.list.length >= MAX ? "（最大" + MAX + "件）" : "") : "";
    document.getElementById("nz-tools").hidden = !state.list.length;
    if (!state.list.length) { box.appendChild(el("p", { class: "nz-empty", text: "まだ候補がありません。上の欄に名前を入れて「追加」を押してください。" })); return; }
    rows.forEach(function (row, n) {
      var c = row.c, v = row.v, full = state.sei + c.mei;
      var del = el("button", { type: "button", class: "nz-del", "aria-label": c.mei + "を候補から消す", text: "×", onclick: function () { state.list.splice(row.i, 1); save(); render(); } });
      var fav = el("button", { type: "button", class: "nz-fav" + (c.fav ? " is-on" : ""), "aria-pressed": c.fav ? "true" : "false", "aria-label": c.mei + "をお気に入りにする", text: c.fav ? "♥" : "♡",
        onclick: function () { c.fav = !c.fav; save(); render(); } });
      if (!v) {
        box.appendChild(el("li", { class: "nz-item is-bad" }, [el("span", { class: "nz-rank", text: "?" }),
          el("div", { class: "nz-body" }, [el("b", { class: "nz-name", text: full }), el("small", { text: "画数がわからない文字があります。漢字・ひらがな・カタカナで入れてください。" })]), fav, del]));
        return;
      }
      var g = function (k, label) { var l = L.of(v.r[k].value); return el("span", { class: "nz-g l-" + l.luck }, [label + " " + v.r[k].value, el("em", { text: l.luck })]); };
      box.appendChild(el("li", { class: "nz-item res-" + v.rt.mark.key }, [
        el("span", { class: "nz-rank", text: state.sort === "score" ? String(n + 1) : "" }),
        el("span", { class: "nz-mark", role: "img", "aria-label": v.rt.mark.label, text: v.rt.mark.mark }),
        el("div", { class: "nz-body" }, [
          el("a", { class: "nz-name", href: "../?sei=" + encodeURIComponent(state.sei) + "&mei=" + encodeURIComponent(c.mei) }, [el("span", { class: "nz-sei", text: state.sei }), c.mei]),
          el("span", { class: "nz-label", text: v.rt.mark.label }),
          el("div", { class: "nz-gs" }, [g("jin", "人格"), g("sou", "総格"), g("chi", "地格"), g("gai", "外格")]),
          v.sim ? el("small", { class: "nz-sim", text: v.sim.person.sei + v.sim.person.mei + "と" + v.sim.level.label }) : null
        ]), fav, del]));
    });
  }

  function add(names, err) {
    err.hidden = true;
    var added = 0, dup = 0;
    names.forEach(function (m) {
      m = Array.from(m).slice(0, 10).join("");
      if (!m) return;
      if (state.list.some(function (c) { return c.mei === m; })) { dup++; return; }
      if (state.list.length >= MAX) return;
      state.list.push({ mei: m, fav: false }); added++;
    });
    if (!added) { err.textContent = dup ? "その名前は、もう候補に入っています。" : state.list.length >= MAX ? "候補は" + MAX + "件までです。いらない候補を消してください。" : "名前を入れてください。"; err.hidden = false; }
    save(); render();
    return added;
  }

  function init() {
    var form = document.getElementById("nz-form");
    if (!form) return;
    load();
    var sei = form.querySelector("#nz-sei"), mei = form.querySelector("#nz-mei"), err = document.getElementById("nz-err");
    var bulk = document.getElementById("nz-bulk"), bulkErr = document.getElementById("nz-bulk-err");
    sei.value = state.sei;
    sei.addEventListener("input", function () { state.sei = sei.value.trim().slice(0, 6); save(); render(); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!state.sei) { err.textContent = "先に姓（名字）を入れてください。"; err.hidden = false; sei.focus(); return; }
      if (add(split(mei.value), err)) { mei.value = ""; mei.focus(); }
    });
    document.getElementById("nz-bulk-form").addEventListener("submit", function (e) {
      e.preventDefault();
      if (!state.sei) { bulkErr.textContent = "先に姓（名字）を入れてください。"; bulkErr.hidden = false; sei.focus(); return; }
      if (add(split(bulk.value), bulkErr)) bulk.value = "";
    });
    Array.prototype.forEach.call(document.querySelectorAll("[name=nz-sort]"), function (r) {
      r.checked = r.value === state.sort;
      r.addEventListener("change", function () { state.sort = r.value; save(); render(); });
    });
    document.getElementById("nz-clear").addEventListener("click", function (e) {
      var b = e.currentTarget;
      if (b.getAttribute("data-armed") !== "1") { b.setAttribute("data-armed", "1"); b.textContent = "本当に全部消す？（もう一度押す）"; setTimeout(function () { b.removeAttribute("data-armed"); b.textContent = "候補を全部消す"; }, 4000); return; }
      state.list = []; save(); render(); b.removeAttribute("data-armed"); b.textContent = "候補を全部消す";
    });
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof self !== "undefined" ? self : this);
