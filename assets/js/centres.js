/* GESEA Centres pages: filters on the list, sessions and the small map on each centre page.
   Centre content is in _centres/*.md; sessions come from the ESGE Educational Calendar. */
(function () {
  "use strict";
  var GX = window.GESEA, $ = GX.$, $$ = GX.$$, esc = GX.esc, SITE = GX.SITE;
  var TODAY = GX.today();
  var bySlug = {}; (SITE.centres || []).forEach(function (c) { bySlug[c.slug] = c; });

  /* ---------- list page ---------- */
  var grid = $("#grid");
  if (grid) {
    var fType = "all", fCountry = "all";
    var cards = $$(".card", grid);
    function apply() {
      var n = 0;
      cards.forEach(function (c) {
        var t = c.dataset.type, ok = (fType === "all" || (fType === "diploma" ? t !== "training" : t === "training")) && (fCountry === "all" || c.dataset.country === fCountry);
        c.hidden = !ok; if (ok) n++;
      });
      $("#count").innerHTML = "Showing <b>" + n + "</b> of " + cards.length + " centres";
      $("#empty").hidden = n > 0;
      $$("#fType .chip").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === fType); });
      $$("#fCountry .chip").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === fCountry); });
    }
    $$("#fType .chip").forEach(function (b) { b.addEventListener("click", function () { fType = b.dataset.v; apply(); }); });
    $$("#fCountry .chip").forEach(function (b) { b.addEventListener("click", function () { fCountry = b.dataset.v; apply(); }); });
    GX.loadSessions().then(function (res) {
      cards.forEach(function (card) {
        var c = bySlug[card.dataset.slug]; if (!c) return;
        var next = GX.sessionsFor(c, res.events).filter(function (e) { return e.end.slice(0, 10) >= TODAY; })[0];
        if (next) { var box = $(".next", card); $("b", box).textContent = GX.dateParts(next).text; box.hidden = false; }
      });
    });
  }

  /* ---------- centre page ---------- */
  var app = $("#app[data-centre]");
  if (!app) return;
  var centre = bySlug[app.dataset.centre] || { keywords: [] };
  var city = app.dataset.city, country = app.dataset.country;

  /* initials in the team circles */
  $$(".av[data-initials]").forEach(function (a) {
    var n = a.dataset.initials.replace(/\b(Prof\.?|Dr\.?|Mr\.?|Mrs\.?|Professor|Med)\b/gi, "").replace(/[|]/g, " ").trim().split(/\s+/).filter(function (w) { return /^[A-ZÀ-ÖØ-Ýa-z]/.test(w) && w[0] === w[0].toUpperCase(); });
    a.textContent = n.length ? (n[0][0] + (n.length > 1 ? n[n.length - 1][0] : "")).toUpperCase() : "";
  });

  /* sessions */
  var tab = "up", showAll = false, up = [], past = [];
  function row(e, isPast, i) {
    var d = GX.dateParts(e), tg = GX.tagsFor(e.title);
    return '<div class="srow" style="animation-delay:' + i * 50 + 'ms"><div class="dateb' + (isPast ? " past" : "") + '"><b>' + d.top + "</b><small>" + d.bot + "</small></div>" +
      '<div><div class="tags">' + tg.map(function (t, k) { return '<span class="' + (k ? "k" : "") + '">' + t + "</span>"; }).join("") + '</div><div class="tt">' + esc(e.title) + '</div><div class="dd">' + d.text + " · " + esc(city) + ", " + esc(country) + "</div></div>" +
      '<a class="btn ' + (isPast ? "" : "solid ") + 'sm" href="' + esc(e.url) + '" target="_blank" rel="noopener">View event</a></div>';
  }
  function render() {
    $$(".tabs button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.tab === tab); });
    var all = tab === "up" ? up : past, L = showAll ? all : all.slice(0, 6), el = $("#slist");
    if (!all.length) {
      el.innerHTML = '<div class="srow" style="grid-template-columns:1fr"><div><div class="tt">' + (tab === "up" ? "No upcoming sessions are listed yet." : "No past sessions are listed this year.") + '</div><div class="dd">Check the <a href="' + esc(SITE.sessions.calendar_url) + '" target="_blank" rel="noopener" style="color:var(--blue)">ESGE Educational Calendar</a> for all GESEA sessions.</div></div></div>';
      return;
    }
    el.innerHTML = L.map(function (e, i) { return row(e, tab === "past", i); }).join("") + (all.length > L.length ? '<button class="btn sm more" id="moreBtn">Show all ' + all.length + " sessions</button>" : "");
    var m = $("#moreBtn"); if (m) m.addEventListener("click", function () { showAll = true; render(); });
  }
  $$(".tabs button").forEach(function (b) { b.addEventListener("click", function () { tab = b.dataset.tab; showAll = false; render(); }); });
  GX.loadSessions().then(function (res) {
    var mine = GX.sessionsFor(centre, res.events);
    up = mine.filter(function (e) { return e.end.slice(0, 10) >= TODAY; });
    past = mine.filter(function (e) { return e.end.slice(0, 10) < TODAY; }).reverse();
    $("#nUp").textContent = up.length; $("#nPast").textContent = past.length;
    if (!res.live) $("#srcNote").textContent = " (saved copy" + (res.generated ? " from " + res.generated : "") + ")";
    tab = (up.length || !past.length) ? "up" : "past"; render();
    var n = up[0];
    if (n) {
      var d = GX.dateParts(n);
      $("#nextbar").innerHTML = '<div class="nextbar"><div class="dateb"><b>' + d.top + "</b><small>" + d.bot + '</small></div><div><div class="k">NEXT SESSION AT THIS CENTRE</div><div class="t">' + esc(n.title) + '</div></div><a class="btn sm" href="' + esc(n.url) + '" target="_blank" rel="noopener">View event <span class="ar">→</span></a></div>';
    }
  });

  /* small locator map */
  var svgEl = $("#cmap");
  if (svgEl && window.d3) {
    var lat = +app.dataset.lat, lng = +app.dataset.lng;
    fetch(SITE.base + "/assets/data/land-110m.geojson").then(function (r) { return r.json(); }).then(function (land) {
      var svg = d3.select(svgEl), proj = d3.geoMercator().center([lng, lat]).scale(900).translate([150, 90]);
      svg.append("path").datum(land).attr("class", "land").attr("d", d3.geoPath(proj));
      var p = proj([lng, lat]);
      svg.append("circle").attr("class", "halo").attr("cx", p[0]).attr("cy", p[1]).attr("r", 16);
      svg.append("circle").attr("class", "pulse").attr("cx", p[0]).attr("cy", p[1]).attr("r", 8);
      svg.append("circle").attr("class", "pin").attr("cx", p[0]).attr("cy", p[1]).attr("r", 5.5);
      svg.append("text").attr("x", p[0] + 12).attr("y", p[1] + 4).attr("font-family", "Poppins,sans-serif").attr("font-size", 12).attr("font-weight", 600).attr("fill", "#00396B").attr("paint-order", "stroke").attr("stroke", "#EEF6FD").attr("stroke-width", 3).text(city);
    });
  }
})();
