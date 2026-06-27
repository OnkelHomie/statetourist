/* ==========================================================================
   StateV · Los Santos Stadtführer — main.js
   Reine Vanilla-JS Logik: Daten, Rendering, Interaktionen, Animationen.
   Keine externen Bibliotheken. Daten zentral in DATA gehalten -> leicht erweiterbar.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Icon-Helper (nutzt das Inline-SVG-Sprite in index.html) ---------- */
  function icon(name, attrs) {
    attrs = attrs || "";
    return '<svg ' + attrs + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-' + name + '"/></svg>';
  }
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };

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

    categories: [
      { id: "krankenhaus", label: "Krankenhaus", icon: "cross", x: 38, y: 40 },
      { id: "polizei", label: "Polizeistation", icon: "shield", x: 55, y: 30 },
      { id: "feuerwehr", label: "Feuerwehr", icon: "flame", x: 62, y: 55 },
      { id: "rathaus", label: "Rathaus", icon: "landmark", x: 47, y: 52 },
      { id: "arbeitsamt", label: "Arbeitsamt", icon: "briefcase", x: 30, y: 62 },
      { id: "bank", label: "Bank", icon: "coins", x: 50, y: 42 },
      { id: "tankstelle", label: "Tankstellen", icon: "fuel", x: 70, y: 38 },
      { id: "garage", label: "Garagen", icon: "warehouse", x: 25, y: 45 },
      { id: "shop", label: "Shops", icon: "bag", x: 60, y: 68 }
    ],

    places: [
      { cat: "krankenhaus", icon: "cross", title: "Pillbox Hill Medical", desc: "Zentrales Krankenhaus mit Notaufnahme rund um die Uhr.", loc: "Pillbox Hill", hours: "24 Stunden geöffnet" },
      { cat: "polizei", icon: "shield", title: "LSPD Mission Row", desc: "Hauptrevier des Los Santos Police Department.", loc: "Mission Row", hours: "24 Stunden besetzt" },
      { cat: "feuerwehr", icon: "flame", title: "Feuerwache Davis", desc: "Brandbekämpfung und Rettungsdienst für den Süden.", loc: "Davis", hours: "24 Stunden einsatzbereit" },
      { cat: "rathaus", icon: "landmark", title: "Rathaus Los Santos", desc: "Personalausweis, Anmeldungen und Bürgerservice.", loc: "Vinewood Blvd.", hours: "Mo–Fr 08:00–20:00" },
      { cat: "arbeitsamt", icon: "briefcase", title: "Arbeitsamt", desc: "Anmeldung für alle städtischen Jobs und Berufe.", loc: "Legion Square", hours: "Täglich 07:00–22:00" },
      { cat: "bank", icon: "coins", title: "Fleeca Bank", desc: "Bankkonto eröffnen, Geld abheben und Überweisungen.", loc: "Innenstadt", hours: "Mo–Sa 09:00–18:00" },
      { cat: "tankstelle", icon: "fuel", title: "LTD Tankstelle", desc: "Kraftstoff, Snacks und kleine Einkäufe.", loc: "Mehrere Standorte", hours: "24 Stunden geöffnet" },
      { cat: "garage", icon: "warehouse", title: "Zentralgarage", desc: "Hier holst du deine Fahrzeuge ab und stellst sie ab.", loc: "Innenstadt & Bezirke", hours: "Immer zugänglich" },
      { cat: "shop", icon: "bag", title: "24/7 Supermarkt", desc: "Lebensmittel, Getränke und Alltagsbedarf.", loc: "Stadtweit", hours: "24 Stunden geöffnet" }
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
        { t: "Legion Square", time: "08:00" }, { t: "Pillbox Hill", time: "08:06" }, { t: "Mission Row", time: "08:12" }, { t: "Vinewood Blvd.", time: "08:20" }, { t: "Rockford Hills", time: "08:28" }
      ]},
      { type: "bus", color: "linear-gradient(135deg,#36d6c6,#2aa7c2)", badge: "B2", name: "Küsten-Linie", note: "Bus · Takt alle 15 Min.", stops: [
        { t: "Del Perro Pier", time: "08:05" }, { t: "Vespucci Beach", time: "08:14" }, { t: "Flughafen LSIA", time: "08:25" }, { t: "Hafen", time: "08:36" }
      ]},
      { type: "tram", color: "linear-gradient(135deg,#ef6f5e,#e0556b)", badge: "T1", name: "Vinewood-Tram", note: "Straßenbahn · Takt alle 12 Min.", stops: [
        { t: "Downtown", time: "09:00" }, { t: "Galileo Observatory", time: "09:11" }, { t: "Vinewood Hills", time: "09:22" }, { t: "Casino", time: "09:33" }
      ]},
      { type: "tram", color: "linear-gradient(135deg,#8a7dff,#6f9bff)", badge: "T2", name: "Süd-Tram", note: "Straßenbahn · Takt alle 12 Min.", stops: [
        { t: "Davis", time: "09:05" }, { t: "Strawberry", time: "09:15" }, { t: "Legion Square", time: "09:26" }, { t: "Maze Bank", time: "09:35" }
      ]}
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
      { icon: "dice", title: "Bowling", desc: "Strikes mit Freunden im Bowlingcenter." },
      { icon: "dice", title: "Casino", desc: "Roulette, Slots und Blackjack im Diamond." },
      { icon: "wine", title: "Bars", desc: "Gemütliche Drinks an stilvollen Theken." },
      { icon: "music", title: "Clubs", desc: "Tanzen bis in die frühen Morgenstunden." },
      { icon: "target", title: "Paintball", desc: "Taktische Matches in der Paintball-Arena." },
      { icon: "flag", title: "Rennstrecke", desc: "Teste deine Rundenzeiten auf dem Kurs." },
      { icon: "film", title: "Kino", desc: "Aktuelle Filme auf großer Leinwand." },
      { icon: "fish", title: "Angeln", desc: "Ruhige Stunden am Wasser mit der Rute." },
      { icon: "mountain", title: "Wandern", desc: "Trails durch die Berge von Chiliad." }
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
     RENDER-FUNKTIONEN
     ====================================================================== */
  function renderNews() {
    var el = $("#newsGrid");
    el.innerHTML = DATA.news.map(function (n, i) {
      return '<article class="news-card glass ' + (n.feature ? "feature" : "") + ' reveal" data-delay="' + (i % 3) + '">' +
        '<span class="tag tag--' + n.tag + '">' + n.tagLabel + '</span>' +
        '<h3>' + n.title + '</h3>' +
        '<p>' + n.text + '</p>' +
        '<div class="meta">' + icon("clock", 'width="14" height="14"') + n.meta + '</div>' +
      '</article>';
    }).join("");
  }

  function renderEvents(filter) {
    var grid = $("#eventGrid");
    var items = DATA.events.filter(function (e) { return !filter || filter === "Alle" || e.cat === filter; });
    grid.innerHTML = items.map(function (e, i) {
      return '<article class="event-card glass reveal" data-delay="' + (i % 3) + '">' +
        '<div class="ec-top"><div class="ec-date"><b>' + e.day + '</b><span>' + e.mon + '</span></div><span class="ec-cat">' + e.cat + '</span></div>' +
        '<div class="ec-body"><h3>' + e.title + '</h3><p>' + e.text + '</p>' +
          '<div class="ec-meta">' +
            '<div>' + icon("clock", 'width="16" height="16"') + e.time + '</div>' +
            '<div>' + icon("pin", 'width="16" height="16"') + e.place + '</div>' +
          '</div>' +
        '</div></article>';
    }).join("");
    if (revealObserver) revealScan(grid);
  }

  function renderEventFilters() {
    var cats = ["Alle"]; 
    DATA.events.forEach(function (e) { if (cats.indexOf(e.cat) < 0) cats.push(e.cat); });
    var el = $("#eventFilters");
    el.innerHTML = cats.map(function (c, i) {
      return '<button class="chip' + (i === 0 ? " active" : "") + '" data-cat="' + c + '" data-testid="event-filter-' + c.toLowerCase() + '">' + c + '</button>';
    }).join("");
    el.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".chip"); if (!btn) return;
      el.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
      btn.classList.add("active");
      renderEvents(btn.getAttribute("data-cat"));
    });
  }

  function renderMap() {
    var side = $("#mapCategories");
    var canvas = $("#mapCanvas");
    // Kategorie-Buttons
    side.insertAdjacentHTML("beforeend", DATA.categories.map(function (c, i) {
      return '<button class="cat-btn' + (i === 0 ? " active" : "") + '" data-cat="' + c.id + '" data-testid="cat-' + c.id + '">' +
        '<span class="ci">' + icon(c.icon, 'width="17" height="17"') + '</span>' + c.label + '</button>';
    }).join(""));
    // Marker auf der Karte
    canvas.insertAdjacentHTML("beforeend", DATA.categories.map(function (c) {
      return '<button class="marker" data-cat="' + c.id + '" style="left:' + c.x + '%;top:' + c.y + '%" aria-label="' + c.label + '">' +
        icon(c.icon, 'width="18" height="18"') + '<span class="tip">' + c.label + '</span></button>';
    }).join(""));

    function setCat(id) {
      side.querySelectorAll(".cat-btn").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-cat") === id); });
      canvas.querySelectorAll(".marker").forEach(function (m) { m.classList.toggle("dim", m.getAttribute("data-cat") !== id); });
      document.querySelectorAll("#placesGrid .place-card").forEach(function (p) { p.classList.toggle("is-hidden", p.getAttribute("data-cat") !== id); });
    }
    side.addEventListener("click", function (ev) { var b = ev.target.closest(".cat-btn"); if (b) setCat(b.getAttribute("data-cat")); });
    canvas.addEventListener("click", function (ev) { var m = ev.target.closest(".marker"); if (m) setCat(m.getAttribute("data-cat")); });

    // Places
    $("#placesGrid").innerHTML = DATA.places.map(function (p, i) {
      var grad = "linear-gradient(135deg,#1a2330,#0c1017)";
      return '<article class="place-card glass" data-cat="' + p.cat + '" data-delay="' + (i % 3) + '">' +
        '<div class="pc-thumb" style="background:' + grad + '"><span class="ci">' + icon(p.icon, 'width="24" height="24"') + '</span></div>' +
        '<div class="pc-body"><h4>' + p.title + '</h4><p>' + p.desc + '</p>' +
          '<div class="pc-meta"><span>' + icon("pin", 'width="14" height="14"') + p.loc + '</span>' +
          '<span>' + icon("clock", 'width="14" height="14"') + p.hours + '</span></div>' +
        '</div></article>';
    }).join("");
    setCat(DATA.categories[0].id);
  }

  function renderJobs() {
    $("#jobGrid").innerHTML = DATA.jobs.map(function (j, i) {
      var dots = "";
      for (var d = 1; d <= 5; d++) dots += '<i class="' + (d <= j.diff ? "on" : "") + '"></i>';
      return '<article class="job-card glass reveal" data-delay="' + (i % 3) + '">' +
        (j.beginner ? '<span class="beginner-badge">Für Anfänger</span>' : '') +
        '<span class="ji">' + icon(j.icon, 'width="24" height="24"') + '</span>' +
        '<h3>' + j.title + '</h3><p>' + j.desc + '</p>' +
        '<div class="job-stats">' +
          '<div class="js"><span>Schwierigkeit</span><b class="diff">' + dots + '</b></div>' +
          '<div class="js"><span>Verdienst</span><b>' + j.pay + '</b></div>' +
        '</div></article>';
    }).join("");
  }

  function renderTransit() {
    $("#transitGrid").innerHTML = DATA.transit.map(function (l, i) {
      return '<article class="line-card glass reveal" data-delay="' + (i % 2) + '">' +
        '<div class="line-head"><span class="line-badge" style="background:' + l.color + '">' + l.badge + '</span>' +
        '<div><h3>' + l.name + '</h3><span>' + l.note + '</span></div></div>' +
        '<div class="stops">' + l.stops.map(function (s) {
          return '<div class="stop"><span class="t">' + s.t + '</span><span class="time">' + s.time + '</span></div>';
        }).join("") + '</div></article>';
    }).join("");
  }

  function renderSights() {
    $("#sightsGrid").innerHTML = DATA.sights.map(function (s, i) {
      return '<article class="sight-card reveal" data-delay="' + (i % 4) + '">' +
        '<img src="images/' + s.img + '.png" alt="' + s.title + '" loading="lazy" />' +
        '<div class="sc-body"><span class="sc-cat">' + s.cat + '</span><h3>' + s.title + '</h3><p>' + s.desc + '</p></div>' +
      '</article>';
    }).join("");
  }

  function renderFreizeit() {
    $("#freizeitGrid").innerHTML = DATA.freizeit.map(function (f, i) {
      return '<article class="tile glass reveal" data-delay="' + (i % 3) + '">' +
        '<span class="ti">' + icon(f.icon, 'width="23" height="23"') + '</span>' +
        '<h3>' + f.title + '</h3><p>' + f.desc + '</p></article>';
    }).join("");
  }

  function renderCompanies() {
    $("#companyGrid").innerHTML = DATA.companies.map(function (c, i) {
      return '<article class="company-card glass reveal" data-delay="' + (i % 2) + '">' +
        '<div class="company-logo">' + icon(c.icon, 'width="30" height="30"') + '<span class="ph">Logo</span></div>' +
        '<div class="cc-body"><span class="cc-type">' + c.type + '</span><h3>' + c.title + '</h3><p>' + c.desc + '</p></div>' +
      '</article>';
    }).join("");
  }

  function renderTimeline() {
    $("#timeline").innerHTML = DATA.timeline.map(function (t, i) {
      return '<div class="tl-step reveal" data-delay="' + (i % 4) + '">' +
        '<span class="tl-num">' + (i + 1) + '</span>' +
        '<div class="tl-card glass"><h3>' + icon(t.icon, 'width="18" height="18"') + t.title + '</h3><p>' + t.text + '</p></div>' +
      '</div>';
    }).join("");
  }

  function renderFaq() {
    var el = $("#faqList");
    el.innerHTML = DATA.faq.map(function (f, i) {
      return '<div class="faq-item glass" data-testid="faq-item-' + i + '">' +
        '<button class="faq-q" aria-expanded="false"><span>' + f.q + '</span><span class="ic">' + icon("plus", 'width="16" height="16"') + '</span></button>' +
        '<div class="faq-a"><div class="faq-a-inner">' + f.a + '</div></div>' +
      '</div>';
    }).join("");
    el.addEventListener("click", function (ev) {
      var q = ev.target.closest(".faq-q"); if (!q) return;
      var item = q.parentElement;
      var ans = item.querySelector(".faq-a");
      var open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
      ans.style.maxHeight = open ? ans.scrollHeight + "px" : "0px";
    });
  }

  function renderGallery() {
    $("#gallery").innerHTML = DATA.gallery.map(function (g) {
      if (g.img) {
        return '<figure class="m-item"><img src="images/' + g.img + '.png" alt="' + g.cap + '" loading="lazy" /><figcaption class="m-cap">' + g.cap + '</figcaption></figure>';
      }
      return '<figure class="m-item"><div class="m-grad" style="background:' + g.grad + ';--ar:' + g.ar + '">' + icon("camera", 'width="30" height="30"') + '</div><figcaption class="m-cap">' + g.cap + '</figcaption></figure>';
    }).join("");
  }

  /* ======================================================================
     INTERAKTIONEN & ANIMATIONEN
     ====================================================================== */
  var revealObserver;
  function initReveal() {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealScan(document);
  }
  function revealScan(root) {
    root.querySelectorAll(".reveal:not(.in)").forEach(function (el) { revealObserver.observe(el); });
  }

  function initNav() {
    var nav = $("#nav");
    var toggle = $("#navToggle");
    var links = document.querySelectorAll(".nav-link");
    window.addEventListener("scroll", function () {
      nav.classList.toggle("scrolled", window.scrollY > 30);
      $("#toTop").classList.toggle("show", window.scrollY > 600);
    });
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    });
    document.getElementById("navLinks").addEventListener("click", function (ev) {
      if (ev.target.closest("a")) { nav.classList.remove("open"); toggle.classList.remove("open"); }
    });

    // Scroll-Spy
    var sections = [];
    links.forEach(function (a) {
      var t = document.querySelector(a.getAttribute("href"));
      if (t) sections.push({ link: a, sec: t });
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("active"); });
          var match = sections.filter(function (s) { return s.sec === e.target; })[0];
          if (match) match.link.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s.sec); });
  }

  function initToTop() {
    $("#toTop").addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ======================================================================
     INIT
     ====================================================================== */
  document.addEventListener("DOMContentLoaded", function () {
    $("#year").textContent = new Date().getFullYear();
    renderNews();
    renderEventFilters();
    renderEvents();
    renderMap();
    renderJobs();
    renderTransit();
    renderSights();
    renderFreizeit();
    renderCompanies();
    renderTimeline();
    renderFaq();
    renderGallery();
    initReveal();
    initNav();
    initToTop();
  });
})();
