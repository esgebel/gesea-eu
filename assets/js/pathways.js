/* Pathways and GESEA4EU pages: gentle reveal while scrolling, and the side index (levels / steps)
   that jumps to an item and follows the reading position. Behaviour only; the words are in _data/. */
(function () {
  "use strict";
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* reveal on scroll */
  if (!RM && "IntersectionObserver" in window) {
    var rv = $$(".rv"), h = innerHeight;
    rv.forEach(function (el) { if (el.getBoundingClientRect().top < h * 0.92) el.classList.add("in"); });
    document.documentElement.classList.add("js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { if (!el.classList.contains("in")) io.observe(el); });
  }

  /* side index (levels / steps): click goes exactly to the item, and the index follows the reading position */
  var idx = document.querySelector(".pw-idx");
  if (idx) {
    var links = $$(".pw-idx a"), targets = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
    var lock = 0;
    function offset() { var n = document.querySelector(".nav"), h = n ? n.getBoundingClientRect().bottom : 0; if (innerWidth <= 980) h = Math.max(h, idx.getBoundingClientRect().bottom); return Math.max(h, 0) + 24; }
    function topOf(t) { var m = 0; try { m = new DOMMatrix(getComputedStyle(t).transform).m42 || 0; } catch (e) {} return t.getBoundingClientRect().top - m + scrollY; }
    function setOn(i) { links.forEach(function (a, k) { a.classList.toggle("on", k === i); }); }
    links.forEach(function (a, i) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        setOn(i); lock = Date.now() + 1200;
        window.scrollTo({ top: Math.max(0, topOf(targets[i]) - offset()), behavior: RM ? "auto" : "smooth" });
        if (history.replaceState) history.replaceState(null, "", a.getAttribute("href"));
      });
    });
    function spy() {
      if (Date.now() < lock) return;
      var line = scrollY + offset() + 40, cur = 0;
      targets.forEach(function (t, k) { if (t && topOf(t) <= line) cur = k; });
      setOn(cur);
    }
    addEventListener("scroll", spy, { passive: true }); spy();
  }
})();
