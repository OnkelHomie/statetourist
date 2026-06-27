/* ==========================================================================
   StateV · Los Santos Stadtführer — main.js (Multi-Page)
   Zentrale Vanilla-JS Basis für alle Unterseiten.
   - Icon-Sprite, Navigation & Footer werden zentral injiziert (DRY).
   - Seitenspezifischer Inhalt wird anhand von <body data-page="..."> gerendert.
   - Alle Daten zentral im DATA-Objekt -> leicht erweiterbar.
   Keine externen Bibliotheken.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Icon-Sprite (lokal, Inline-SVG) ---------- */
  var SPRITE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<symbol id="i-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></symbol>' +
    '<symbol id="i-pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></symbol>' +
    '<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>' +
    '<symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></symbol>' +
    '<symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>' +
    '<symbol id="i-arrow-up" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></symbol>' +
    '<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>' +
    '<symbol id="i-newspaper" viewBox="0 0 24 24"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-2h4"/><path d="M16 6h2v4h-2zM8 6h4M8 10h4M8 14h8M8 18h8"/></symbol>' +
    '<symbol id="i-megaphone" viewBox="0 0 24 24"><path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6"/></symbol>' +
    '<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></symbol>' +
    '<symbol id="i-shield-check" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></symbol>' +
    '<symbol id="i-cross" viewBox="0 0 24 24"><path d="M11 2h2a1 1 0 0 1 1 1v5h5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5v5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-5H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h5V3a1 1 0 0 1 1-1Z"/></symbol>' +
    '<symbol id="i-flame" viewBox="0 0 24 24"><path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 9 8 12 2Z"/><path d="M12 22a6 6 0 0 0 6-6c0-3-2-4-2-4"/></symbol>' +
    '<symbol id="i-landmark" viewBox="0 0 24 24"><path d="M3 22h18M4 10h16M5 10l7-6 7 6M6 10v8M10 10v8M14 10v8M18 10v8"/></symbol>' +
    '<symbol id="i-briefcase" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/></symbol>' +
    '<symbol id="i-coins" viewBox="0 0 24 24"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82"/></symbol>' +
    '<symbol id="i-fuel" viewBox="0 0 24 24"><path d="M3 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18M2 22h13M13 9h3a2 2 0 0 1 2 2v6a2 2 0 0 0 2 2 2 2 0 0 0 2-2V8l-3-3"/><path d="M6 6h4"/></symbol>' +
    '<symbol id="i-warehouse" viewBox="0 0 24 24"><path d="M22 8.35V20a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8.35a2 2 0 0 1 1.26-1.86l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18v-5h12v5M6 14h12"/></symbol>' +
    '<symbol id="i-bag" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0"/></symbol>' +
    '<symbol id="i-trash" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/></symbol>' +
    '<symbol id="i-bus" viewBox="0 0 24 24"><path d="M4 6h16v10H4zM4 16v3M20 16v3M4 11h16"/><circle cx="8" cy="16" r="1.4"/><circle cx="16" cy="16" r="1.4"/><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2"/></symbol>' +
    '<symbol id="i-tram" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="14" rx="2"/><path d="M5 10h14M12 3v7M8 21l2-3M16 21l-2-3M9 3 5 1M15 3l4-2"/><circle cx="9" cy="13.5" r="1"/><circle cx="15" cy="13.5" r="1"/></symbol>' +
    '<symbol id="i-car" viewBox="0 0 24 24"><path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13M3 13h18v5H3zM5 18v2M19 18v2"/><circle cx="7.5" cy="15.5" r="1"/><circle cx="16.5" cy="15.5" r="1"/></symbol>' +
    '<symbol id="i-fish" viewBox="0 0 24 24"><path d="M6.5 12c3-5 9-6 14-6-1 5-4 11-9 11-2 0-4-1.5-5-3M6.5 12 3 9v6l3.5-3ZM16 9.5h.01"/></symbol>' +
    '<symbol id="i-tractor" viewBox="0 0 24 24"><path d="M4 4h6l1 5M3 9h11l2 5"/><circle cx="7" cy="16" r="4"/><circle cx="18" cy="17" r="3"/><path d="M14 14h3"/></symbol>' +
    '<symbol id="i-axe" viewBox="0 0 24 24"><path d="M14 4l6 6-3 3-6-6 3-3ZM11 7 3 15l3 3 8-8"/></symbol>' +
    '<symbol id="i-pickaxe" viewBox="0 0 24 24"><path d="M14.5 3a8 8 0 0 1 6.5 6.5M3 9.5A8 8 0 0 1 9.5 3M14.5 3 21 9.5M12 6 6 12l6 6 6-6M5 19l5-5"/></symbol>' +
    '<symbol id="i-truck" viewBox="0 0 24 24"><path d="M2 6h12v10H2zM14 9h4l3 3v4h-7zM2 16v0"/><circle cx="6.5" cy="17.5" r="1.6"/><circle cx="17.5" cy="17.5" r="1.6"/></symbol>' +
    '<symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></symbol>' +
    '<symbol id="i-dice" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2"/><circle cx="16" cy="8" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="8" cy="16" r="1.2"/><circle cx="16" cy="16" r="1.2"/></symbol>' +
    '<symbol id="i-wine" viewBox="0 0 24 24"><path d="M8 22h8M12 16v6M6 3h12l-1 6a5 5 0 0 1-10 0L6 3ZM6.5 7h11"/></symbol>' +
    '<symbol id="i-music" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></symbol>' +
    '<symbol id="i-flag" viewBox="0 0 24 24"><path d="M4 22V4M4 4h13l-2 4 2 4H4"/></symbol>' +
    '<symbol id="i-film" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4M17 8h4M3 16h4M17 16h4M3 12h18"/></symbol>' +
    '<symbol id="i-mountain" viewBox="0 0 24 24"><path d="m8 3 4 8 5-5 5 11H2L8 3Z"/></symbol>' +
    '<symbol id="i-utensils" viewBox="0 0 24 24"><path d="M3 2v7a3 3 0 0 0 6 0V2M6 2v20M16 2c-1.5 0-3 2-3 6 0 3 1 4 3 4v10"/></symbol>' +
    '<symbol id="i-wrench" viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-2.4 2.5-2.5Z"/></symbol>' +
    '<symbol id="i-bed" viewBox="0 0 24 24"><path d="M3 8v12M3 14h18a0 0 0 0 1 0 0v6M21 14v-2a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3v2"/><path d="M6 11h2"/></symbol>' +
    '<symbol id="i-plane" viewBox="0 0 24 24"><path d="M17.8 19.2 16 11l5-5a2.1 2.1 0 0 0-3-3l-5 5-8.2-1.8a.5.5 0 0 0-.5.8l4 4-2 4-2-1-1 1 3 2 2 3 1-1-1-2 4-2 4 4a.5.5 0 0 0 .8-.5Z"/></symbol>' +
    '<symbol id="i-id" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2.2"/><path d="M5 16c.6-1.6 2-2 3-2s2.4.4 3 2M14 9h5M14 12h5M14 15h3"/></symbol>' +
    '<symbol id="i-card" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></symbol>' +
    '<symbol id="i-phone" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></symbol>' +
    '<symbol id="i-home" viewBox="0 0 24 24"><path d="M3 11l9-8 9 8M5 9v11h14V9M10 20v-6h4v6"/></symbol>' +
    '<symbol id="i-camera" viewBox="0 0 24 24"><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z"/><circle cx="12" cy="13" r="3.5"/></symbol>' +
    '<symbol id="i-euro" viewBox="0 0 24 24"><path d="M18 7a7 7 0 1 0 0 10M4 10h9M4 14h7"/></symbol>' +
    '<symbol id="i-sparkle" viewBox="0 0 24 24"><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z"/></symbol>' +
    '<symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c.7-3.5 3-5 6-5s5.3 1.5 6 5M16 5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.3 2.2 3.8 5"/></symbol>' +
    '</defs></svg>';

  function icon(name, attrs) {
    attrs = attrs || "";
    return '<svg ' + attrs + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-' + name + '"/></svg>';
  }
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var ARR = icon("arrow-right", 'width="18" height="18"');
  var PUBLISHED_FIRMA = null;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function imgSrc(v) { if (!v) return ""; return /^https?:\/\//.test(v) ? v : "images/" + v + ".png"; }
  function cardMedia(img, alt) {
    if (!img) return "";
    return '<div class="card-media"><img src="' + imgSrc(img) + '" alt="' + esc(alt) + '" loading="lazy" /></div>';
  }

  /* ---------- Freizeit-Popup ---------- */
  function openFzModal(item) {
    if (!item) return;
    var back = document.createElement("div");
    back.className = "fz-modal-backdrop";
    back.setAttribute("data-testid", "freizeit-modal");
    back.innerHTML = '<div class="fz-modal glass" role="dialog" aria-modal="true">' +
      '<button class="fz-close" aria-label="Schließen" data-testid="freizeit-modal-close">&times;</button>' +
      '<span class="fz-ic">' + icon(item.icon, 'width="30" height="30"') + '</span>' +
      '<h3>' + esc(item.title) + '</h3><p>' + esc(item.long || item.desc) + '</p></div>';
    document.body.appendChild(back);
    requestAnimationFrame(function () { back.classList.add("show"); });
    function close() { back.classList.remove("show"); setTimeout(function () { back.remove(); document.removeEventListener("keydown", onKey); }, 300); }
    function onKey(e) { if (e.key === "Escape") close(); }
    back.addEventListener("click", function (e) { if (e.target === back || e.target.closest(".fz-close")) close(); });
    document.addEventListener("keydown", onKey);
  }

  /* ---------- Inhalte aus der StateV vAPI (Page Options) lesen ----------
     Liest die vom Admin veröffentlichten, gechunkten Inhalte. Bei jedem
     Fehler (kein Key, offline, leer) wird auf die Standardinhalte zurückgegriffen. */
  async function loadFromVapi() {
    var cfg = window.STATEV_CONFIG;
    if (!cfg || !cfg.apiKey || !cfg.base || !cfg.firmaId) return;
    var base = cfg.base.replace(/\/$/, "");
    var H = { "Authorization": "Bearer " + cfg.apiKey };
    var url = function (slot) { return base + "/factory/options/" + cfg.firmaId + "/" + slot; };
    try {
      var ctrl = new AbortController();
      var to = setTimeout(function () { ctrl.abort(); }, 7000);
      var mRes = await fetch(url(1), { headers: H, signal: ctrl.signal });
      if (!mRes.ok) { clearTimeout(to); return; }
      var meta = await mRes.json();
      if (!meta || !meta.data) { clearTimeout(to); return; }
      var info = JSON.parse(meta.data);
      var n = info.c || 0;
      if (!n) { clearTimeout(to); return; }
      var reqs = [];
      for (var i = 0; i < n; i++) {
        reqs.push(fetch(url(2 + i), { headers: H, signal: ctrl.signal }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }));
      }
      var parts = await Promise.all(reqs);
      clearTimeout(to);
      var raw = parts.map(function (p) { return p && p.data ? p.data : ""; }).join("");
      var bundle = JSON.parse(raw);
      applyBundle(bundle);
    } catch (e) { /* Fallback auf eingebaute Standardinhalte */ }
  }

  function applyBundle(bundle) {
    if (!bundle) return;
    if (bundle.events && bundle.events.length) DATA.events = bundle.events;
    if (bundle.news && bundle.news.length) DATA.news = bundle.news;
    if (bundle.gallery && bundle.gallery.length) DATA.gallery = bundle.gallery;
    if (bundle.sights && bundle.sights.length) DATA.sights = bundle.sights;
    if (bundle.jobs && bundle.jobs.length) DATA.jobs = bundle.jobs;
    if (bundle.companies && bundle.companies.length) DATA.companies = bundle.companies;
    if (bundle.freizeit && bundle.freizeit.length) DATA.freizeit = bundle.freizeit;
    if (bundle.firma) PUBLISHED_FIRMA = bundle.firma;
  }

  /* ---------- Admin-Vorschau: Entwurfsdaten direkt vom Backend laden ----------
     Nur aktiv, wenn die URL den Parameter ?previewApi enthält (vom Admin gesetzt).
     Der reguläre, im Spiel ausgelieferte Guide nutzt diesen Pfad NIE und bleibt statisch. */
  async function loadPreview(apiBase) {
    try {
      var url = (apiBase || "").replace(/\/$/, "") + "/api/preview/bundle";
      var r = await fetch(url, { credentials: "include" });
      if (!r.ok) return;
      applyBundle(await r.json());
    } catch (e) { /* still mit Standardinhalten */ }
  }

  function firmaStatusHTML() {
    var f = PUBLISHED_FIRMA;
    if (!f) return "";
    var open = !!f.isOpen;
    return '<div class="firma-status glass reveal">' +
      '<span class="fs-badge ' + (open ? "on" : "off") + '">' + (open ? "Geöffnet" : "Geschlossen") + "</span>" +
      '<div class="fs-main"><span class="fs-label">Live-Status · StateV vAPI</span><h3>' + esc(f.name || "Unsere Firma") + "</h3>" +
      '<div class="fs-meta">' +
        (f.address ? "<span>" + icon("pin", 'width="15" height="15"') + esc(f.address) + "</span>" : "") +
        (f.type ? "<span>" + icon("briefcase", 'width="15" height="15"') + esc(f.type) + "</span>" : "") +
      "</div></div></div>";
  }

  /* ---------- Navigation / Routing ---------- */
  var NAV = [
    { p: "start", href: "index.html", label: "Startseite" },
    { p: "arbeiten", href: "arbeiten.html", label: "Arbeiten" },
    { p: "nahverkehr", href: "nahverkehr.html", label: "Nahverkehr" },
    { p: "sehenswuerdigkeiten", href: "sehenswuerdigkeiten.html", label: "Sehenswürdigkeiten" },
    { p: "freizeit", href: "freizeit.html", label: "Freizeit" },
    { p: "unternehmen", href: "unternehmen.html", label: "Unternehmen" },
    { p: "events", href: "events.html", label: "Events" }
  ];

  var brandHTML = '<a href="index.html" class="brand" aria-label="Los Santos Stadtführer Startseite">' +
    '<span class="logo">' + icon("compass", 'width="21" height="21"') + '</span>' +
    '<span><b>Los Santos</b> <span>Guide</span></span></a>';

  function buildNav(current) {
    var links = NAV.map(function (n) {
      return '<li><a href="' + n.href + '" class="nav-link' + (n.p === current ? " active" : "") + '" data-testid="nav-' + n.p + '">' + n.label + '</a></li>';
    }).join("");
    return '<nav class="nav" id="nav" data-testid="main-nav"><div class="container">' +
      brandHTML +
      '<ul class="nav-links" id="navLinks">' + links + '</ul>' +
      '<a href="events.html" class="btn btn--primary nav-cta" data-testid="nav-cta">Events ' + ARR + '</a>' +
      '<button class="nav-toggle" id="navToggle" aria-label="Menü öffnen" data-testid="nav-toggle"><span></span><span></span><span></span></button>' +
      '</div></nav>';
  }

  function buildFooter() {
    var navCols = NAV.slice(0, 5).map(function (n) { return '<a href="' + n.href + '">' + n.label + '</a>'; }).join("");
    var moreCols = NAV.slice(5).map(function (n) { return '<a href="' + n.href + '">' + n.label + '</a>'; }).join("") + '<a href="galerie.html">Galerie</a>';
    return '<footer class="footer" id="footer"><div class="container">' +
      '<div class="footer-grid">' +
        '<div class="footer-about">' + brandHTML +
          '<p>Der offizielle Touristen- und Stadtführer für Los Santos &amp; San Andreas. Erstellt für die StateV-Community.</p></div>' +
        '<div class="footer-col"><h4>Navigation</h4>' + navCols + '</div>' +
        '<div class="footer-col"><h4>Mehr</h4>' + moreCols + '</div>' +
        '<div class="footer-col"><h4>Kontakt</h4>' +
          '<p>' + icon("pin", 'width="14" height="14" style="display:inline;vertical-align:-2px;margin-right:6px"') + ' Rathaus, Vinewood Blvd.</p>' +
          '<p>Bürgerbüro: täglich 08–20 Uhr</p>' +
          '<div class="seal-box" data-testid="statev-seal" style="margin-top:14px">' +
            '<div class="seal-icon">' + icon("shield-check", 'width="28" height="28"') + '</div>' +
            '<div class="st"><b>StateV Verifizierungssiegel</b><span>Hier wird das offizielle Siegel eingebunden</span></div></div>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom"><span>© <span id="year"></span> Los Santos Stadtführer · Ein StateV Community-Projekt. Alle Inhalte sind fiktiv (In-Game).</span>' +
        '<div class="fb-links"><a href="#">Impressum</a><a href="#">Datenschutz</a><a href="#">Kontakt</a></div></div>' +
      '</div></footer>';
  }

  /* ---------- Bausteine ---------- */
  function pageHead(eyebrow, title, sub, center) {
    return '<div class="section-head reveal' + (center ? " center" : "") + '">' +
      '<span class="eyebrow"><span class="dot"></span> ' + eyebrow + '</span>' +
      '<h2>' + title + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>';
  }

  /* ======================================================================
     ZENTRALE DATEN
     ====================================================================== */
  var DATA = {
    news: [
      { tag: "mayor", tagLabel: "Bürgermeister", feature: true, title: "Großoffensive für saubere Straßen gestartet", text: "Bürgermeister Alvarez kündigt ein Investitionspaket für Parks, Beleuchtung und den Ausbau des Nahverkehrs an. „Los Santos soll für jeden lebenswert sein.“", meta: "Heute · Rathaus" },
      { tag: "news", tagLabel: "Stadt-News", title: "Neuer Strandabschnitt am Del Perro eröffnet", text: "Mehr Platz zum Verweilen, neue Promenade und Foodtrucks.", meta: "Vor 2 Std." },
      { tag: "police", tagLabel: "Polizei", title: "Verkehrskontrollen am Highway", text: "Das LSPD bittet um vorsichtige Fahrweise auf der Route 68.", meta: "Vor 4 Std." },
      { tag: "event", tagLabel: "Event", title: "Street Race am Wochenende", text: "Die Tuning-Szene trifft sich Samstagnacht im Hafenviertel.", meta: "Morgen" },
      { tag: "news", tagLabel: "Stadt-News", title: "Maze Bank Tower mit neuer Aussichtsplattform", text: "Ab sofort öffentlich zugänglich – der beste Blick über die Stadt.", meta: "Gestern" }
    ],
    events: [
      { cat: "Sport", day: "14", mon: "Jun", title: "Street Race", text: "Illegales Straßenrennen durch die Innenstadt – nur für Mutige mit schnellen Autos.", time: "22:00 Uhr", place: "Hafenviertel" },
      { cat: "Nightlife", day: "15", mon: "Jun", title: "Clubabend im Vanilla Unicorn", text: "Die heißeste Nacht der Woche mit Live-DJ und Specials an der Bar.", time: "23:00 Uhr", place: "Strawberry" },
      { cat: "Sport", day: "16", mon: "Jun", title: "Angelturnier am Pier", text: "Wer fängt den größten Fisch? Anmeldung vor Ort, tolle Preise.", time: "09:00 Uhr", place: "Del Perro Pier" },
      { cat: "Sport", day: "18", mon: "Jun", title: "Boxevent", text: "Die besten Kämpfer der Stadt treten im Ring gegeneinander an.", time: "20:00 Uhr", place: "Vespucci Arena" },
      { cat: "Markt", day: "20", mon: "Jun", title: "Markttag", text: "Regionale Produkte, Handgemachtes und Schnäppchen auf dem großen Wochenmarkt.", time: "10:00 Uhr", place: "Legion Square" },
      { cat: "Nightlife", day: "21", mon: "Jun", title: "Casino Gala-Nacht", text: "Eleganter Abend mit Dresscode, Roulette und Live-Musik.", time: "21:00 Uhr", place: "Diamond Casino" }
    ],
    jobs: [
      { icon: "trash", title: "Müllabfuhr", desc: "Sammle Müll in der ganzen Stadt ein – ein verlässlicher Einstiegsjob.", diff: 1, pay: "€ Niedrig", beginner: true },
      { icon: "bus", title: "Busfahrer", desc: "Fahre feste Routen ab und bringe Bürger ans Ziel.", diff: 2, pay: "€€ Mittel", beginner: true },
      { icon: "tram", title: "Straßenbahnfahrer", desc: "Steuere die Tram entlang des Schienennetzes der Stadt.", diff: 2, pay: "€€ Mittel", beginner: true },
      { icon: "car", title: "Taxifahrer", desc: "Hole Fahrgäste ab und verdiene am Trinkgeld mit.", diff: 2, pay: "€€ Mittel", beginner: true },
      { icon: "fish", title: "Fischer", desc: "Fahre raus aufs Meer und verkaufe deinen Fang.", diff: 3, pay: "€€ Mittel", beginner: false },
      { icon: "tractor", title: "Farmer", desc: "Bestelle Felder, ernte Pflanzen und versorge die Stadt.", diff: 2, pay: "€€ Mittel", beginner: true },
      { icon: "axe", title: "Holzfäller", desc: "Fälle Bäume im Wald und liefere Holz zum Sägewerk.", diff: 3, pay: "€€€ Hoch", beginner: false },
      { icon: "pickaxe", title: "Bergarbeiter", desc: "Baue Erze in der Mine ab – körperlich anspruchsvoll.", diff: 4, pay: "€€€ Hoch", beginner: false },
      { icon: "truck", title: "LKW Fahrer", desc: "Transportiere Fracht über lange Strecken durch San Andreas.", diff: 3, pay: "€€€ Hoch", beginner: false },
      { icon: "target", title: "Jäger", desc: "Erlege Wild in den Bergen und verkaufe Felle und Fleisch.", diff: 4, pay: "€€€ Hoch", beginner: false }
    ],
    transit: [
      { type: "bus", color: "linear-gradient(135deg,#f5b942,#f08a3c)", badge: "B1", name: "Innenstadt-Linie", note: "Bus · Takt alle 10 Min.", stops: [
        { t: "Legion Square", time: "08:00" }, { t: "Pillbox Hill", time: "08:06" }, { t: "Mission Row", time: "08:12" }, { t: "Vinewood Blvd.", time: "08:20" }, { t: "Rockford Hills", time: "08:28" } ] },
      { type: "bus", color: "linear-gradient(135deg,#36d6c6,#2aa7c2)", badge: "B2", name: "Küsten-Linie", note: "Bus · Takt alle 15 Min.", stops: [
        { t: "Del Perro Pier", time: "08:05" }, { t: "Vespucci Beach", time: "08:14" }, { t: "Flughafen LSIA", time: "08:25" }, { t: "Hafen", time: "08:36" } ] },
      { type: "tram", color: "linear-gradient(135deg,#ef6f5e,#e0556b)", badge: "T1", name: "Vinewood-Tram", note: "Straßenbahn · Takt alle 12 Min.", stops: [
        { t: "Downtown", time: "09:00" }, { t: "Galileo Observatory", time: "09:11" }, { t: "Vinewood Hills", time: "09:22" }, { t: "Casino", time: "09:33" } ] },
      { type: "tram", color: "linear-gradient(135deg,#8a7dff,#6f9bff)", badge: "T2", name: "Süd-Tram", note: "Straßenbahn · Takt alle 12 Min.", stops: [
        { t: "Davis", time: "09:05" }, { t: "Strawberry", time: "09:15" }, { t: "Legion Square", time: "09:26" }, { t: "Maze Bank", time: "09:35" } ] }
    ],
    sights: [
      { img: "vinewood", cat: "Wahrzeichen", title: "Vinewood Sign", desc: "Der berühmte Schriftzug hoch über der Stadt – das beste Fotomotiv." },
      { img: "pier", cat: "Strand", title: "Del Perro Pier", desc: "Riesenrad, Spielhallen und Sonnenuntergänge am Meer." },
      { img: "observatory", cat: "Aussicht", title: "Galileo Observatory", desc: "Sterne beobachten und über den Lichtern der Stadt schweben." },
      { img: "casino", cat: "Entertainment", title: "Diamond Casino", desc: "Glanz, Glamour und das große Glück mitten in Vinewood." },
      { img: "mazebank", cat: "Architektur", title: "Maze Bank Tower", desc: "Das höchste Gebäude der Stadt mit Aussichtsplattform." },
      { img: "airport", cat: "Verkehr", title: "Flughafen LSIA", desc: "Das Tor zur Welt – Ankunftspunkt für alle Neuankömmlinge." },
      { img: "harbor", cat: "Industrie", title: "Hafen von Los Santos", desc: "Wo Fracht und Geschichten aus aller Welt anlanden." },
      { img: "golf", cat: "Freizeit", title: "GWC Golfplatz", desc: "Gepflegte Greens für eine entspannte Runde unter Palmen." }
    ],
    freizeit: [
      { icon: "dice", title: "Bowling", desc: "Strikes mit Freunden im Bowlingcenter.", long: "Im modernen Bowlingcenter triffst du dich mit Freunden zu entspannten Runden. Mehrere Bahnen, Schuhverleih und eine Bar sorgen für einen gelungenen Abend – ideal für Gruppen und kleine Turniere." },
      { icon: "dice", title: "Casino", desc: "Roulette, Slots und Blackjack im Diamond.", long: "Das Diamond Casino bietet Roulette, Blackjack, Spielautomaten und ein gehobenes Ambiente. Setze dein Glück aufs Spiel – aber behalte einen kühlen Kopf. Dresscode erwünscht." },
      { icon: "wine", title: "Bars", desc: "Gemütliche Drinks an stilvollen Theken.", long: "Über die ganze Stadt verteilt findest du stilvolle Bars für jeden Geschmack – von der ruhigen Cocktailbar bis zur lebhaften Strandbar. Perfekt, um neue Leute kennenzulernen." },
      { icon: "music", title: "Clubs", desc: "Tanzen bis in die frühen Morgenstunden.", long: "Die Clubs von Los Santos sind das Herz des Nachtlebens: Live-DJs, Lichtshows und Tanzflächen, die erst im Morgengrauen leerer werden. Schau in den Eventkalender für Specials." },
      { icon: "target", title: "Paintball", desc: "Taktische Matches in der Paintball-Arena.", long: "In der Paintball-Arena trittst du in taktischen Team-Matches gegeneinander an. Ausrüstung wird gestellt – Teamgeist und schnelle Reflexe bringst du mit." },
      { icon: "flag", title: "Rennstrecke", desc: "Teste deine Rundenzeiten auf dem Kurs.", long: "Auf der offiziellen Rennstrecke kannst du gefahrlos deine Rundenzeiten verbessern, Fahrzeuge testen und an Zeitrennen teilnehmen. Ein Muss für jeden Auto-Fan." },
      { icon: "film", title: "Kino", desc: "Aktuelle Filme auf großer Leinwand.", long: "Das Kino zeigt regelmäßig wechselnde Filme auf großer Leinwand. Schnapp dir Popcorn und genieße einen entspannten Abend – auch für Dates bestens geeignet." },
      { icon: "fish", title: "Angeln", desc: "Ruhige Stunden am Wasser mit der Rute.", long: "Ob am Pier, am See oder auf hoher See – Angeln ist die perfekte Entschleunigung. Mit etwas Geduld fängst du wertvolle Fische, die du verkaufen oder zubereiten kannst." },
      { icon: "mountain", title: "Wandern", desc: "Trails durch die Berge von Chiliad.", long: "Die Trails rund um den Mount Chiliad bieten atemberaubende Ausblicke. Schnür die Wanderschuhe, nimm Wasser mit und entdecke die Natur von San Andreas zu Fuß." }
    ],
    companies: [
      { icon: "utensils", type: "Gastronomie", title: "Bayview Restaurant", desc: "Feine Küche mit Blick aufs Meer – ideal für besondere Anlässe." },
      { icon: "wrench", type: "Werkstatt", title: "LS Customs", desc: "Tuning, Reparaturen und Lackierungen für jedes Fahrzeug." },
      { icon: "car", type: "Autohaus", title: "Premium Deluxe Motors", desc: "Vom Kleinwagen bis zum Sportwagen – dein Traumauto wartet." },
      { icon: "fuel", type: "Tankstelle", title: "RON Energie", desc: "Kraftstoff und Shop-Artikel an Standorten in der ganzen Stadt." },
      { icon: "bed", type: "Hotel", title: "Von Crastenburg Hotel", desc: "Luxuriöse Zimmer und erstklassiger Service im Herzen der Stadt." },
      { icon: "music", type: "Club", title: "Galaxy Nightclub", desc: "Der angesagteste Club mit den größten Events der Woche." }
    ],
    timeline: [
      { icon: "plane", title: "Flughafen verlassen", text: "Du landest am LSIA. Verlasse das Terminal und betritt zum ersten Mal Los Santos." },
      { icon: "id", title: "Personalausweis", text: "Gehe zum Rathaus und beantrage deinen Personalausweis – dein wichtigstes Dokument." },
      { icon: "card", title: "Führerschein", text: "Lege die Fahrprüfung ab, um legal Fahrzeuge führen zu dürfen." },
      { icon: "coins", title: "Bankkonto", text: "Eröffne bei der Fleeca Bank ein Konto für sichere Zahlungen." },
      { icon: "phone", title: "Handy kaufen", text: "Besorge dir ein Smartphone, um erreichbar zu sein und Dienste zu nutzen." },
      { icon: "home", title: "Wohnung finden", text: "Suche dir ein Zuhause – vom kleinen Apartment bis zur Villa in den Hills." },
      { icon: "briefcase", title: "Ersten Job", text: "Melde dich beim Arbeitsamt und starte deinen ersten Beruf für ein Einkommen." },
      { icon: "car", title: "Erstes Fahrzeug", text: "Kaufe dir beim Autohaus dein erstes eigenes Fahrzeug und werde mobil." }
    ],
    faq: [
      { q: "Wie fange ich als neuer Spieler am besten an?", a: "Folge unserem Anfänger-Guide Schritt für Schritt: zuerst Personalausweis im Rathaus, dann Führerschein, Bankkonto und ein erster Job. So hast du schnell ein Einkommen und kannst die Stadt erkunden." },
      { q: "Welcher Job eignet sich für Einsteiger?", a: "Müllabfuhr, Busfahrer, Taxifahrer und Farmer sind ideal für den Start. Sie sind leicht zu erlernen und bieten ein verlässliches Einkommen ohne große Anfangsinvestition." },
      { q: "Wie komme ich ohne eigenes Auto durch die Stadt?", a: "Nutze den Nahverkehr! Bus- und Straßenbahnlinien verbinden alle wichtigen Bezirke. Die Linienübersicht im Bereich Nahverkehr zeigt dir Haltestellen und Beispiel-Abfahrtszeiten." },
      { q: "Wo eröffne ich ein Bankkonto?", a: "Bei jeder Fleeca-Filiale in der Innenstadt. Mit einem Konto kannst du bargeldlos bezahlen, Geld sicher aufbewahren und Überweisungen tätigen." },
      { q: "Wie finde ich eine Wohnung?", a: "Wohnungen und Häuser sind über die ganze Stadt verteilt. Achte auf Schilder vor verfügbaren Objekten – vom günstigen Apartment bis zur Luxusvilla ist alles dabei." },
      { q: "Wo finde ich aktuelle Events?", a: "Im Eventkalender auf dieser Seite. Dort findest du alle kommenden Veranstaltungen mit Datum, Uhrzeit und Ort – von Street Races bis zum Markttag." }
    ],
    gallery: [
      { img: "hero", cap: "Skyline bei Sonnenuntergang", ar: 1.5 },
      { img: "vinewood", cap: "Vinewood Sign", ar: 1 },
      { img: "pier", cap: "Del Perro Pier", ar: 1 },
      { grad: "linear-gradient(135deg,#f5b942,#ef6f5e)", cap: "Goldene Stunde", ar: 1.3 },
      { img: "observatory", cap: "Observatory bei Nacht", ar: 1 },
      { img: "casino", cap: "Diamond Casino", ar: 1 },
      { grad: "linear-gradient(135deg,#36d6c6,#2aa7c2)", cap: "Küstenstraße", ar: 0.8 },
      { img: "mazebank", cap: "Maze Bank Tower", ar: 1 },
      { img: "harbor", cap: "Der Hafen", ar: 1 },
      { grad: "linear-gradient(135deg,#6f9bff,#8a7dff)", cap: "Nachtleben", ar: 1.2 },
      { img: "golf", cap: "GWC Golfplatz", ar: 1 },
      { img: "airport", cap: "Flughafen LSIA", ar: 1 }
    ]
  };

  /* ======================================================================
     INHALTS-BAUSTEINE (geben HTML-Strings zurück)
     ====================================================================== */
  function newsHTML() {
    return DATA.news.map(function (n, i) {
      return '<article class="news-card glass ' + (n.feature ? "feature" : "") + ' reveal" data-delay="' + (i % 3) + '">' +
        '<span class="tag tag--' + n.tag + '">' + n.tagLabel + '</span><h3>' + n.title + '</h3><p>' + n.text + '</p>' +
        '<div class="meta">' + icon("clock", 'width="14" height="14"') + n.meta + '</div></article>';
    }).join("");
  }

  function eventCardsHTML(filter) {
    return DATA.events.filter(function (e) { return !filter || filter === "Alle" || e.cat === filter; }).map(function (e, i) {
      var bg = e.bg ? '<div class="ec-bg" style="background-image:url(\'' + imgSrc(e.bg) + '\')"></div>' : "";
      return '<article class="event-card glass reveal' + (e.bg ? " has-bg" : "") + '" data-delay="' + (i % 3) + '">' + bg +
        '<div class="ec-top"><div class="ec-date"><b>' + e.day + '</b><span>' + e.mon + '</span></div><span class="ec-cat">' + e.cat + '</span></div>' +
        '<div class="ec-body"><h3>' + e.title + '</h3><p>' + e.text + '</p><div class="ec-meta">' +
        '<div>' + icon("clock", 'width="16" height="16"') + e.time + '</div>' +
        '<div>' + icon("pin", 'width="16" height="16"') + e.place + '</div></div></div></article>';
    }).join("");
  }

  function jobsHTML() {
    return DATA.jobs.map(function (j, i) {
      var dots = ""; for (var d = 1; d <= 5; d++) dots += '<i class="' + (d <= j.diff ? "on" : "") + '"></i>';
      return '<article class="job-card glass reveal" data-delay="' + (i % 3) + '">' +
        (j.beginner ? '<span class="beginner-badge">Für Anfänger</span>' : '') +
        cardMedia(j.img, j.title) +
        '<span class="ji">' + icon(j.icon, 'width="24" height="24"') + '</span><h3>' + j.title + '</h3><p>' + j.desc + '</p>' +
        '<div class="job-stats"><div class="js"><span>Schwierigkeit</span><b class="diff">' + dots + '</b></div>' +
        '<div class="js"><span>Verdienst</span><b>' + j.pay + '</b></div></div></article>';
    }).join("");
  }

  function transitHTML() {
    return DATA.transit.map(function (l, i) {
      return '<article class="line-card glass reveal" data-delay="' + (i % 2) + '">' +
        '<div class="line-head"><span class="line-badge" style="background:' + l.color + '">' + l.badge + '</span>' +
        '<div><h3>' + l.name + '</h3><span>' + l.note + '</span></div></div><div class="stops">' +
        l.stops.map(function (s) { return '<div class="stop"><span class="t">' + s.t + '</span><span class="time">' + s.time + '</span></div>'; }).join("") +
        '</div></article>';
    }).join("");
  }

  function sightsHTML() {
    return DATA.sights.map(function (s, i) {
      return '<article class="sight-card reveal" data-delay="' + (i % 4) + '">' +
        '<img src="' + imgSrc(s.img) + '" alt="' + esc(s.title) + '" loading="lazy" />' +
        '<div class="sc-body"><span class="sc-cat">' + s.cat + '</span><h3>' + s.title + '</h3><p>' + s.desc + '</p></div></article>';
    }).join("");
  }

  function freizeitHTML() {
    return DATA.freizeit.map(function (f, i) {
      return '<button class="tile glass reveal' + (f.img ? " has-media" : "") + '" type="button" data-fz="' + i + '" data-delay="' + (i % 3) + '" data-testid="freizeit-' + i + '">' +
        cardMedia(f.img, f.title) +
        '<span class="ti">' + icon(f.icon, 'width="23" height="23"') + '</span><h3>' + f.title + '</h3><p>' + f.desc + '</p>' +
        '<span class="tile-go">Mehr erfahren ' + ARR + '</span></button>';
    }).join("");
  }

  function companiesHTML() {
    return DATA.companies.map(function (c, i) {
      return '<article class="company-card glass reveal' + (c.img ? " has-media" : "") + '" data-delay="' + (i % 2) + '">' +
        (c.img ? cardMedia(c.img, c.title)
               : '<div class="company-logo">' + icon(c.icon, 'width="30" height="30"') + '<span class="ph">Logo</span></div>') +
        '<div class="cc-body"><span class="cc-type">' + c.type + '</span><h3>' + c.title + '</h3><p>' + c.desc + '</p></div></article>';
    }).join("");
  }

  function timelineHTML() {
    return DATA.timeline.map(function (t, i) {
      return '<div class="tl-step reveal" data-delay="' + (i % 4) + '"><span class="tl-num">' + (i + 1) + '</span>' +
        '<div class="tl-card glass"><h3>' + icon(t.icon, 'width="18" height="18"') + t.title + '</h3><p>' + t.text + '</p></div></div>';
    }).join("");
  }

  function faqHTML() {
    return DATA.faq.map(function (f, i) {
      return '<div class="faq-item glass" data-testid="faq-item-' + i + '">' +
        '<button class="faq-q" aria-expanded="false"><span>' + f.q + '</span><span class="ic">' + icon("plus", 'width="16" height="16"') + '</span></button>' +
        '<div class="faq-a"><div class="faq-a-inner">' + f.a + '</div></div></div>';
    }).join("");
  }

  function galleryHTML() {
    return DATA.gallery.map(function (g) {
      if (g.img) return '<figure class="m-item"><img src="' + imgSrc(g.img) + '" alt="' + esc(g.cap) + '" loading="lazy" /><figcaption class="m-cap">' + esc(g.cap) + '</figcaption></figure>';
      return '<figure class="m-item"><div class="m-grad" style="background:' + g.grad + ';--ar:' + g.ar + '">' + icon("camera", 'width="30" height="30"') + '</div><figcaption class="m-cap">' + esc(g.cap) + '</figcaption></figure>';
    }).join("");
  }

  function quicklinksHTML() {
    var items = [
      { href: "arbeiten.html", icon: "briefcase", t: "Arbeiten", d: "Berufe mit Verdienst & Schwierigkeit." },
      { href: "nahverkehr.html", icon: "bus", t: "Nahverkehr", d: "Bus- und Straßenbahnlinien der Stadt." },
      { href: "sehenswuerdigkeiten.html", icon: "camera", t: "Sehenswürdigkeiten", d: "Die ikonischsten Orte von Los Santos." },
      { href: "freizeit.html", icon: "dice", t: "Freizeit", d: "Bowling, Casino, Clubs und mehr." },
      { href: "events.html", icon: "calendar", t: "Events", d: "Kommende Veranstaltungen im Überblick." }
    ];
    return items.map(function (q, i) {
      return '<a href="' + q.href + '" class="tile glass reveal" data-delay="' + (i % 3) + '" data-testid="quicklink-' + q.icon + '">' +
        '<span class="ti">' + icon(q.icon, 'width="23" height="23"') + '</span><h3>' + q.t + '</h3><p>' + q.d + '</p>' +
        '<span class="tile-go">Mehr ' + ARR + '</span></a>';
    }).join("");
  }

  function heroHTML() {
    return '<header class="hero" id="start"><div class="hero-bg"><img src="images/hero.png" alt="Panorama von Los Santos bei Sonnenuntergang" fetchpriority="high" /></div>' +
      '<div class="container"><div class="hero-inner">' +
      '<span class="eyebrow reveal"><span class="dot"></span> Offizieller Stadtführer · San Andreas</span>' +
      '<h1 class="reveal" data-delay="1">Willkommen in <span class="grad-text">Los&nbsp;Santos</span></h1>' +
      '<p class="sub reveal" data-delay="2">Entdecke die lebendigste Stadt San Andreas. Dein Wegweiser durch Sehenswürdigkeiten, Jobs, Nahverkehr und das pulsierende Stadtleben.</p>' +
      '<div class="hero-actions reveal" data-delay="3">' +
      '<a href="sehenswuerdigkeiten.html" class="btn btn--primary" data-testid="hero-cta-sights">' + icon("camera", 'width="18" height="18"') + ' Sehenswürdigkeiten</a>' +
      '<a href="events.html" class="btn btn--ghost" data-testid="hero-cta-events">Events ansehen ' + ARR + '</a></div>' +
      '<div class="hero-stats reveal" data-delay="4">' +
      '<div class="stat glass"><b>8+</b><span>Stadtbezirke</span></div>' +
      '<div class="stat glass"><b>10</b><span>Berufe</span></div>' +
      '<div class="stat glass"><b>24/7</b><span>Stadtleben</span></div>' +
      '<div class="stat glass"><b>∞</b><span>Möglichkeiten</span></div></div>' +
      '</div></div><div class="scroll-hint"><div class="mouse"></div><span>Scrollen</span></div></header>';
  }

  /* ======================================================================
     SEITEN-RENDERER
     ====================================================================== */
  function section(inner, first, tight) {
    return '<section class="section' + (first ? " page-first" : "") + (tight ? " section--tight" : "") + '"><div class="container">' + inner + '</div></section>';
  }

  var PAGES = {
    start: function () {
      return heroHTML() +
        section(pageHead("Aktuelles", 'Was in <span class="grad-text">der Stadt</span> passiert', "Neuigkeiten, Mitteilungen des Bürgermeisters, Stadt-News, Polizeimeldungen und Event-Highlights.") + '<div class="news-grid">' + newsHTML() + '</div>') +
        section(pageHead("Entdecke mehr", 'Dein Weg durch <span class="grad-text">Los Santos</span>', "Wähle einen Bereich und tauche tiefer in die Stadt ein.") + '<div class="card-grid grid-3">' + quicklinksHTML() + '</div>', false, true);
    },
    arbeiten: function () {
      return section(pageHead("Arbeiten", 'Finde deinen <span class="grad-text">Beruf</span>', "Ob als Einsteiger oder Profi – in Los Santos gibt es für jeden den passenden Job. Schwierigkeit, Verdienst und Anfänger-Empfehlung auf einen Blick.") + '<div class="card-grid grid-3">' + jobsHTML() + '</div>', true);
    },
    nahverkehr: function () {
      return section(pageHead("Nahverkehr", 'Mobil durch <span class="grad-text">Los Santos</span>', "Das Liniennetz aus Bussen und Straßenbahnen bringt dich schnell und günstig ans Ziel – mit Linien, Haltestellen und Beispiel-Abfahrtszeiten.") + '<div class="transit-wrap">' + transitHTML() + '</div>', true);
    },
    sehenswuerdigkeiten: function () {
      return section(pageHead("Sehenswürdigkeiten", 'Orte, die du <span class="grad-text">gesehen haben musst</span>', "Vom legendären Vinewood Sign bis zum Galileo Observatory – die ikonischsten Plätze der Stadt.") + '<div class="card-grid grid-4">' + sightsHTML() + '</div>', true);
    },
    freizeit: function () {
      return section(pageHead("Freizeit", 'Spaß für <span class="grad-text">jeden Tag</span>', "Langweilig wird es nie: Bowling, Casino, Clubs, Paintball und vieles mehr warten auf dich.") + '<div class="card-grid grid-3">' + freizeitHTML() + '</div>', true);
    },
    unternehmen: function () {
      return section(pageHead("Unternehmen", 'Die <span class="grad-text">Wirtschaft</span> der Stadt', "Restaurants, Werkstätten, Autohäuser und mehr – betrieben von der Community für die Community.") + firmaStatusHTML() + '<div class="card-grid grid-2">' + companiesHTML() + '</div>', true);
    },
    events: function () {
      var cats = ["Alle"]; DATA.events.forEach(function (e) { if (cats.indexOf(e.cat) < 0) cats.push(e.cat); });
      var filters = cats.map(function (c, i) { return '<button class="chip' + (i === 0 ? " active" : "") + '" data-cat="' + c + '" data-testid="event-filter-' + c.toLowerCase() + '">' + c + '</button>'; }).join("");
      return section(pageHead("Eventkalender", 'Erlebe die <span class="grad-text">Highlights</span>', "Von Street Races bis zum Angelturnier – hier findest du die kommenden Veranstaltungen in Los Santos.") +
        '<div class="filters" id="eventFilters">' + filters + '</div><div class="card-grid grid-3" id="eventGrid">' + eventCardsHTML() + '</div>', true);
    },
    guide: function () {
      return section(pageHead("Anfänger Guide", 'Deine ersten <span class="grad-text">Schritte</span>', "Neu in Los Santos? Folge dieser Schritt-für-Schritt-Anleitung und starte sorgenfrei in dein neues Leben.") + '<div class="timeline">' + timelineHTML() + '</div>', true);
    },
    faq: function () {
      return section(pageHead("FAQ", 'Häufige <span class="grad-text">Fragen</span>', "", true) + '<div class="faq-list" id="faqList">' + faqHTML() + '</div>', true);
    },
    galerie: function () {
      return section(pageHead("Galerie", 'Los Santos in <span class="grad-text">Bildern</span>', "Impressionen und Community-Momente aus der ganzen Stadt.") + '<div class="masonry">' + galleryHTML() + '</div>', true);
    }
  };

  /* ======================================================================
     INTERAKTIONEN
     ====================================================================== */
  var revealObserver;
  function initReveal() {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal:not(.in)").forEach(function (el) { revealObserver.observe(el); });
  }

  function initNav() {
    var nav = $("#nav"), toggle = $("#navToggle");
    window.addEventListener("scroll", function () {
      nav.classList.toggle("scrolled", window.scrollY > 30);
      var tt = $("#toTop"); if (tt) tt.classList.toggle("show", window.scrollY > 600);
    });
    if (window.scrollY > 30) nav.classList.add("scrolled");
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    });
  }

  function initFaq() {
    var el = $("#faqList"); if (!el) return;
    el.addEventListener("click", function (ev) {
      var q = ev.target.closest(".faq-q"); if (!q) return;
      var item = q.parentElement, ans = item.querySelector(".faq-a");
      var open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
      ans.style.maxHeight = open ? ans.scrollHeight + "px" : "0px";
    });
  }

  function initEvents() {
    var el = $("#eventFilters"); if (!el) return;
    el.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".chip"); if (!btn) return;
      el.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
      btn.classList.add("active");
      $("#eventGrid").innerHTML = eventCardsHTML(btn.getAttribute("data-cat"));
      if (revealObserver) document.querySelectorAll("#eventGrid .reveal:not(.in)").forEach(function (e) { revealObserver.observe(e); });
    });
  }

  function initToTop() {
    var btn = document.createElement("button");
    btn.className = "to-top"; btn.id = "toTop"; btn.setAttribute("aria-label", "Nach oben"); btn.setAttribute("data-testid", "to-top");
    btn.innerHTML = icon("arrow-up", 'width="20" height="20"');
    btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    document.body.appendChild(btn);
  }

  /* ======================================================================
     INIT
     ====================================================================== */
  document.addEventListener("DOMContentLoaded", function () {
    var page = document.body.getAttribute("data-page") || "start";
    var VAPI_PAGES = ["start", "events", "galerie", "unternehmen", "sehenswuerdigkeiten", "arbeiten", "freizeit"];

    // Sprite + Navigation einbauen (einmalig)
    document.body.insertAdjacentHTML("afterbegin", SPRITE + buildNav(page));
    var app = $("#app");
    var firstRender = true;

    function renderPage() {
      var renderer = PAGES[page] || PAGES.start;
      app.innerHTML = renderer();
      initFaq();
      initEvents();
      if (firstRender) {
        initReveal();
        firstRender = false;
      } else {
        // Neu-Rendern nach vAPI-Laden: Inhalte sofort & ohne Animation zeigen (kein Flackern)
        app.querySelectorAll(".reveal").forEach(function (el) {
          el.classList.add("in");
          el.style.opacity = "1";
          el.style.transform = "none";
        });
      }
    }

    // Sofort mit Standardinhalten rendern (kein Blockieren durch Netzwerk)
    renderPage();
    app.insertAdjacentHTML("afterend", buildFooter());

    var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

    initToTop();
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-fz]");
      if (b) openFzModal(DATA.freizeit[parseInt(b.getAttribute("data-fz"), 10)]);
    });
    initNav();

    // Inhalte nachladen und neu rendern. Admin-Vorschau (?previewApi) hat Vorrang.
    var sp = new URLSearchParams(window.location.search);
    if (sp.has("previewApi")) {
      loadPreview(sp.get("previewApi") || "").then(function () { renderPage(); });
    } else if (VAPI_PAGES.indexOf(page) >= 0) {
      loadFromVapi().then(function () { renderPage(); });
    }
  });
})();
