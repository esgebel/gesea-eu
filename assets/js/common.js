/* GESEA website - shared helpers, menu, smooth scrolling and ESGE calendar sessions.
   Content lives in _data/*.yml and _centres/*.md; this file only contains behaviour. */
(function () {
  "use strict";
  var SITE = window.GESEA_SITE || { base: "", centres: [], sessions: {} };
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var G = !!(window.gsap && window.ScrollTrigger) && !RM;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = "http://www.w3.org/2000/svg";
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in (a || {})) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* smooth scroll (home page only loads GSAP + Lenis) */
  var lenis = null;
  if (G) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.07, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }
  function scrollToY(y) { if (lenis) lenis.scrollTo(y, { duration: 1.6 }); else window.scrollTo({ top: y, behavior: RM ? "auto" : "smooth" }); }

  /* menu */
  var sheet = $("#sheet"), menuBtn = $("#menuBtn");
  function closeSheet() { if (!sheet) return; sheet.classList.remove("open"); sheet.setAttribute("aria-hidden", "true"); menuBtn.setAttribute("aria-expanded", "false"); }
  if (menuBtn) {
    menuBtn.addEventListener("click", function () { sheet.classList.add("open"); sheet.setAttribute("aria-hidden", "false"); menuBtn.setAttribute("aria-expanded", "true"); $("#sheetClose").focus(); });
    $("#sheetClose").addEventListener("click", closeSheet);
  }

  /* links to a section on the same page scroll smoothly */
  $$("a[href*='#']").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var url = new URL(a.href, location.href);
      var norm = function (x) { return x.replace(/index\.html$/, ""); };
      if (norm(url.pathname) !== norm(location.pathname) || !url.hash || url.hash.length < 2) return;
      var t = document.querySelector(url.hash); if (!t) return;
      e.preventDefault(); closeSheet();
      scrollToY(t.getBoundingClientRect().top + window.scrollY - (url.hash === "#pathway" ? 0 : 60));
    });
  });

  /* ---------- ESGE Educational Calendar sessions ---------- */
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var decoder = document.createElement("textarea");
  function decode(s) { decoder.innerHTML = s || ""; return decoder.value; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

  function normaliseLive(e) {
    return {
      title: decode(e.title), start: e.start_date, end: e.end_date, url: e.url,
      organizer: (e.organizer || []).map(function (o) { return decode(o.organizer); }).join("; "),
      venue: e.venue && e.venue.venue ? [decode(e.venue.venue), e.venue.city || "", e.venue.country || ""].join(" | ") : "",
      categories: (e.categories || []).map(function (c) { return c.name; }).join("; ")
    };
  }
  function isGesea(e) { return /gesea/i.test(e.title + " " + (e.categories || "") + " " + e.organizer); }

  var sessionsPromise = null;
  function loadSessions() {
    if (sessionsPromise) return sessionsPromise;
    var cfg = SITE.sessions || {}, key = "gesea-sessions-v1";
    try { var c = JSON.parse(sessionStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 3600e3) return (sessionsPromise = Promise.resolve(c)); } catch (e) {}
    var year = new Date().getFullYear();
    function page(n, acc) {
      var u = cfg.live_api + "?per_page=50&page=" + n + "&start_date=" + year + "-01-01&end_date=" + (year + 2) + "-12-31";
      return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
        acc = acc.concat((j.events || []).map(normaliseLive));
        return (n < (j.total_pages || 1) && n < 10) ? page(n + 1, acc) : acc;
      });
    }
    sessionsPromise = (cfg.live_api ? page(1, []) : Promise.reject())
      .then(function (ev) { var out = { live: true, events: ev, t: Date.now() }; try { sessionStorage.setItem(key, JSON.stringify(out)); } catch (e) {} return out; })
      .catch(function () {
        return fetch(SITE.base + "/assets/data/sessions-snapshot.json").then(function (r) { return r.json(); })
          .then(function (j) { return { live: false, events: j.events, generated: j.generated }; })
          .catch(function () { return { live: false, events: [] }; });
      })
      .then(function (res) { if (cfg.only_gesea !== false) res.events = res.events.filter(isGesea); return res; });
    return sessionsPromise;
  }
  /* a session belongs to a centre when one of its calendar_keywords appears in the venue or organiser */
  function sessionsFor(centre, events) {
    var kws = (centre.keywords || centre.calendar_keywords || []).map(function (k) { return String(k).toLowerCase(); });
    if (!kws.length) return [];
    return events.filter(function (e) {
      var hay = (e.venue + " " + e.organizer).toLowerCase();
      return kws.some(function (k) { return hay.indexOf(k) > -1; });
    }).sort(function (a, b) { return a.start < b.start ? -1 : 1; });
  }
  function dateParts(e) {
    var a = e.start.slice(0, 10).split("-").map(Number), b = e.end.slice(0, 10).split("-").map(Number);
    var same = e.start.slice(0, 10) === e.end.slice(0, 10), top, bot, text;
    if (same) { top = String(a[2]); bot = MON[a[1] - 1] + " " + a[0]; text = a[2] + " " + MON[a[1] - 1] + " " + a[0]; }
    else if (a[1] === b[1] && a[0] === b[0]) { top = a[2] + "–" + b[2]; bot = MON[a[1] - 1] + " " + a[0]; text = a[2] + "–" + b[2] + " " + MON[a[1] - 1] + " " + a[0]; }
    else { top = a[2] + "–" + b[2]; bot = MON[a[1] - 1] + "–" + MON[b[1] - 1]; text = a[2] + " " + MON[a[1] - 1] + " – " + b[2] + " " + MON[b[1] - 1] + " " + b[0]; }
    return { top: top, bot: bot.toUpperCase(), text: text };
  }
  function tagsFor(t) {
    var out = [];
    if (/robotic/i.test(t)) out.push("Robotics");
    else if (/level\s*1\s*(&|and|\/)\s*(level\s*)?2|l1\s*&\s*2/i.test(t)) out.push("Level 1 & 2");
    else if (/level\s*2/i.test(t)) out.push("Level 2");
    else if (/level\s*1|\bL1\b/i.test(t)) out.push("Level 1");
    var cert = /certification|exam/i.test(t), train = /training|workshop|course|hands-on/i.test(t);
    out.push(cert && train ? "Training & Certification" : cert ? "Certification" : train ? "Training" : "Event");
    return out;
  }

  window.GESEA = {
    SITE: SITE, RM: RM, G: G, $: $, $$: $$, el: el, esc: esc, lenis: lenis, scrollToY: scrollToY, closeSheet: closeSheet,
    loadSessions: loadSessions, sessionsFor: sessionsFor, dateParts: dateParts, tagsFor: tagsFor, today: today
  };
})();
