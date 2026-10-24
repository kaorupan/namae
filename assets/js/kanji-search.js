/* 漢字辞典：入れた漢字のページへ移動する（入力はどこにも送らない） */
(function () {
  "use strict";
  var form = document.getElementById("kanji-form");
  if (!form) return;
  var list = form.getAttribute("data-list") || "", err = document.getElementById("kq-err");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ch = Array.from(form.q.value.trim())[0] || "";
    err.hidden = true;
    if (!ch) { err.textContent = "漢字を1字入れてください。"; err.hidden = false; return; }
    if (list.indexOf(ch) < 0) { err.textContent = "「" + ch + "」は、常用漢字・人名用漢字にふくまれていません。"; err.hidden = false; return; }
    location.href = encodeURI(ch) + "/";
  });
})();
