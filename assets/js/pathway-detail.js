/* Pathway detail pages: the journey steps open one at a time and show their table on the right.
   The words are in _data/pathways/*.yml; this file only contains behaviour. */
(function () {
  "use strict";
  var steps = Array.prototype.slice.call(document.querySelectorAll(".pd-step"));
  function open(step) {
    steps.forEach(function (s) { var on = s === step; s.classList.toggle("on", on); s.querySelector("button").setAttribute("aria-expanded", on); });
    var id = step.getAttribute("data-tbl"), hl = (step.getAttribute("data-hl") || "").split(" ");
    Array.prototype.forEach.call(document.querySelectorAll(".pd-panel > [id]"), function (t) {
      var on = t.id === id;
      if (on) { t.classList.remove("on"); void t.offsetWidth; }
      t.classList.toggle("on", on);
      Array.prototype.forEach.call(t.querySelectorAll("[data-row]"), function (r) { r.classList.toggle("hl", on && hl.indexOf(r.getAttribute("data-row")) > -1); });
    });
  }
  steps.forEach(function (s) { s.querySelector("button").addEventListener("click", function () { open(s); }); });
})();

/* Robotics page: Level 2 MIGS / ECRES switch in the right column. */
(function () {
  "use strict";
  Array.prototype.forEach.call(document.querySelectorAll(".pd-or button"), function (b) {
    b.addEventListener("click", function () {
      var box = b.closest(".pd-grp");
      Array.prototype.forEach.call(box.querySelectorAll(".pd-or button"), function (x) { x.setAttribute("aria-pressed", x === b); });
      Array.prototype.forEach.call(box.querySelectorAll(".pw-tbl"), function (t) { t.classList.toggle("on", t.id === b.getAttribute("data-t")); });
    });
  });
})();
