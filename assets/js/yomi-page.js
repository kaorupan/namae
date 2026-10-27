/* 赤ちゃんの名前（読みごとのページ）：名字を入れると、表の名前それぞれに姓名判断の評価を出す。入力はどこにも送らない。 */
(function (root) {
  "use strict";
  var N = root.Namae, S = N.seimei, C = N.core, KEY = "namae-nazuke-v1";
  function init() {
    var form = document.getElementById("yn-form"), err = document.getElementById("yn-err");
    if (!form) return;
    try { var v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v && v.sei) form.sei.value = v.sei; } catch (e) {}
    function run() {
      var sei = form.sei.value.trim().slice(0, 6);
      err.hidden = true;
      if (!sei) { err.textContent = "名字を入れてください。"; err.hidden = false; form.sei.focus(); return; }
      var rows = Array.prototype.slice.call(document.querySelectorAll(".yn-table tbody tr"));
      rows.forEach(function (tr) {
        var mei = tr.getAttribute("data-mei"), r = S.calculateSeimei({ sei: sei, mei: mei }), cell = tr.querySelector(".yn-mark");
        cell.textContent = "";
        if (!r || !r.ok) { cell.textContent = "—"; tr.removeAttribute("data-rank"); return; }
        var rt = C.rate(r), a = document.createElement("a");
        a.href = "../../../?sei=" + encodeURIComponent(sei) + "&mei=" + encodeURIComponent(mei);
        a.className = "yn-badge res-" + rt.mark.key;
        a.textContent = rt.mark.mark + " " + rt.mark.label.replace(/の?名前$/, "");
        a.setAttribute("aria-label", sei + mei + "：" + rt.mark.label + "（くわしく見る）");
        cell.appendChild(a);
        tr.setAttribute("data-rank", { hanamaru: 0, nijuumaru: 1, maru: 2, sankaku: 3 }[rt.mark.key] * 10 - rt.score);
        var nm = tr.querySelector(".yn-name"); nm.setAttribute("data-sei", sei);
      });
      var body = document.querySelector(".yn-table tbody");
      rows.sort(function (a, b) { return (+a.getAttribute("data-rank") || 99) - (+b.getAttribute("data-rank") || 99); }).forEach(function (tr) { body.appendChild(tr); });
      try { var v2 = JSON.parse(localStorage.getItem(KEY) || "null") || { sei: "", list: [], sort: "score" }; v2.sei = sei; localStorage.setItem(KEY, JSON.stringify(v2)); } catch (e) {}
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
    if (form.sei.value) run();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof self !== "undefined" ? self : this);
