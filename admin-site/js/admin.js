/* ==========================================================================
   StateV Admin · admin.js
   Dashboard für StateV-Firmenverwaltung + Webseiten-CMS.
   Discord-Login geschützt. Vanilla JS, ruft den eigenen Backend-Proxy (/api).
   ========================================================================== */
(function () {
  "use strict";

  var root = document.getElementById("root");
  var user = null;
  var activeTab = "overview";

  function icon(name, attrs) {
    attrs = attrs || "";
    return '<svg ' + attrs + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-' + name + '"/></svg>';
  }

  async function api(path, opts) {
    opts = opts || {};
    opts.credentials = "include";
    if (opts.body && typeof opts.body !== "string") opts.body = JSON.stringify(opts.body);
    opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    var base = (window.ADMIN_API_BASE || "").replace(/\/$/, "");
    var r, data = null;
    try { r = await fetch(base + "/api" + path, opts); } catch (e) { return { ok: false, status: 0, data: { detail: "Netzwerkfehler" } }; }
    try { data = await r.json(); } catch (e) {}
    return { ok: r.ok, status: r.status, data: data };
  }
  function apiBase() { return (window.ADMIN_API_BASE || "").replace(/\/$/, ""); }

  /* ---------- Toast ---------- */
  function toast(msg, type) {
    var host = document.querySelector(".toast-host");
    if (!host) { host = document.createElement("div"); host.className = "toast-host"; document.body.appendChild(host); }
    var t = document.createElement("div");
    t.className = "toast " + (type || "ok"); t.textContent = msg;
    host.appendChild(t);
    setTimeout(function () { t.style.opacity = "0"; t.style.transition = "opacity .3s"; setTimeout(function () { t.remove(); }, 300); }, 2800);
  }

  /* ---------- Wert-Formatierung ---------- */
  function fmt(v) {
    if (v === null || v === undefined || v === "") return '<span style="color:var(--text-dim)">–</span>';
    if (typeof v === "boolean") return v ? '<span class="pill">Ja</span>' : '<span class="pill muted">Nein</span>';
    if (typeof v === "number") return v.toLocaleString("de-DE");
    if (typeof v === "object") return '<span style="color:var(--text-dim);font-size:.82rem">' + escapeHtml(JSON.stringify(v)) + "</span>";
    return escapeHtml(String(v));
  }
  function escapeHtml(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function humanKey(k) { return k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, function (c) { return c.toUpperCase(); }).trim(); }

  function autoTable(rows) {
    if (!rows || !rows.length) return emptyState("Keine Einträge vorhanden.");
    var cols = [];
    rows.slice(0, 12).forEach(function (r) { Object.keys(r || {}).forEach(function (k) { if (cols.indexOf(k) < 0 && k !== "_id") cols.push(k); }); });
    var head = cols.map(function (c) { return "<th>" + humanKey(c) + "</th>"; }).join("");
    var body = rows.map(function (r) {
      return "<tr>" + cols.map(function (c) { return "<td>" + fmt(r ? r[c] : undefined) + "</td>"; }).join("") + "</tr>";
    }).join("");
    return '<div class="tbl-wrap"><table class="tbl"><thead><tr>' + head + "</tr></thead><tbody>" + body + "</tbody></table></div>";
  }

  function keyValueTable(obj) {
    var rows = Object.keys(obj).filter(function (k) { return k !== "_id" && !Array.isArray(obj[k]); })
      .map(function (k) { return "<tr><td class='cell-strong'>" + humanKey(k) + "</td><td>" + fmt(obj[k]) + "</td></tr>"; }).join("");
    return '<div class="tbl-wrap"><table class="tbl"><tbody>' + rows + "</tbody></table></div>";
  }

  function emptyState(msg) { return '<div class="state">' + icon("box", 'width="38" height="38"') + "<div>" + msg + "</div></div>"; }
  function loader() { return '<div class="state"><div class="spinner"></div><div>Lade Daten…</div></div>'; }
  function premiumBox(msg) {
    return '<div class="premium-box"><div class="pb-ic">' + icon("alert", 'width="26" height="26"') + '</div>' +
      '<h4>VAPI Premium erforderlich</h4><p>' + escapeHtml(msg || "Diese Daten sind nur mit StateV VAPI Premium verfügbar.") + "</p></div>";
  }
  function errState(msg) { return '<div class="state">' + icon("alert", 'width="38" height="38"') + "<div>" + escapeHtml(msg || "Fehler beim Laden.") + "</div></div>"; }

  /* ======================================================================
     LOGIN
     ====================================================================== */
  function getParam(name) { return new URLSearchParams(window.location.search).get(name); }

  async function renderLogin() {
    var cfg = await api("/auth/config");
    var configured = cfg.ok && cfg.data && cfg.data.configured;
    var err = getParam("error");
    var errMsg = "";
    if (err === "forbidden") errMsg = "Dein Discord-Account ist nicht als Admin freigeschaltet.";
    else if (err === "denied") errMsg = "Login abgebrochen.";
    else if (err) errMsg = "Login fehlgeschlagen (" + err + ").";

    root.innerHTML =
      '<div class="login-screen"><div class="login-card glass">' +
        '<div class="logo-lg">' + icon("shield-check", 'width="32" height="32"') + "</div>" +
        "<h1>StateV Admin</h1>" +
        "<p>Verwaltung der Firma <b>TouristAbzocke</b> und der Webseite. Bitte mit Discord anmelden.</p>" +
        (configured
          ? '<a class="btn-discord" data-testid="discord-login-btn" href="' + apiBase() + '/api/auth/login">' + icon("discord", 'width="22" height="22"') + " Mit Discord anmelden</a>"
          : '<div class="login-note warn" data-testid="login-warning">' + icon("alert", 'width="16" height="16" style="display:inline;vertical-align:-3px;margin-right:6px"') + " Discord-Login ist noch nicht konfiguriert. Bitte Client-ID & Secret im Backend hinterlegen.</div>") +
        (errMsg ? '<div class="login-note err" data-testid="login-error">' + escapeHtml(errMsg) + "</div>" : "") +
      "</div></div>";
  }

  /* ======================================================================
     DASHBOARD SHELL
     ====================================================================== */
  var TABS = [
    { id: "overview", label: "Übersicht", icon: "grid", group: "Firma" },
    { id: "inventory", label: "Lager", icon: "box", group: "Firma" },
    { id: "machine", label: "Maschinen", icon: "factory", group: "Firma" },
    { id: "counter", label: "Theke", icon: "store", group: "Firma" },
    { id: "productions", label: "Produktionen", icon: "factory", group: "Firma" },
    { id: "vehicles", label: "Fahrzeuge", icon: "car", group: "Firma" },
    { id: "market", label: "Marktangebote", icon: "tag", group: "Firma" },
    { id: "buylog", label: "Verkaufslog", icon: "list", group: "Firma" },
    { id: "bank", label: "Bankkonten", icon: "coins", group: "Firma" },
    { id: "options", label: "Optionen", icon: "cog", group: "Firma" },
    { id: "buildings", label: "Immobilien", icon: "home", group: "Immobilien" },
    { id: "cms", label: "Webseite", icon: "globe", group: "Verwaltung" },
    { id: "publish", label: "Veröffentlichen", icon: "upload", group: "Verwaltung" }
  ];

  function avatarUrl() {
    if (user && user.avatar && user.id) return "https://cdn.discordapp.com/avatars/" + user.id + "/" + user.avatar + ".png?size=64";
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%235865F2'/%3E%3C/svg%3E";
  }

  function renderDash() {
    var groups = {};
    TABS.forEach(function (t) { (groups[t.group] = groups[t.group] || []).push(t); });
    var side = Object.keys(groups).map(function (g) {
      return '<div class="side-group">' + g + "</div>" + groups[g].map(function (t) {
        return '<button class="side-btn" data-tab="' + t.id + '" data-testid="tab-' + t.id + '">' + icon(t.icon, 'width="18" height="18"') + t.label + "</button>";
      }).join("");
    }).join("");

    root.innerHTML =
      '<div class="dash">' +
        '<aside class="dash-side">' +
          '<div class="dash-brand"><span class="logo">' + icon("compass", 'width="20" height="20"') + "</span><span><b>Los Santos</b> <span>Admin</span></span></div>" +
          side +
        "</aside>" +
        '<div class="dash-main">' +
          '<div class="dash-top"><div><h2 id="tabTitle">Übersicht</h2><div class="sub" id="tabSub">StateV Firmenverwaltung</div></div>' +
            '<div class="dash-user"><img src="' + avatarUrl() + '" alt="" /><span class="uname">' + escapeHtml(user.global_name || user.username || "Admin") + "</span>" +
            '<button class="btn-logout" id="logoutBtn" data-testid="logout-btn">' + icon("logout", 'width="15" height="15" style="display:inline;vertical-align:-2px;margin-right:5px"') + "Abmelden</button></div>" +
          "</div>" +
          '<div class="dash-content" id="dashContent"></div>' +
        "</div>" +
      "</div>";

    document.querySelectorAll(".side-btn").forEach(function (b) {
      b.addEventListener("click", function () { selectTab(b.getAttribute("data-tab")); });
    });
    document.getElementById("logoutBtn").addEventListener("click", async function () {
      await api("/auth/logout", { method: "POST" }); window.location.href = "/admin.html";
    });
    selectTab(activeTab);
  }

  function selectTab(id) {
    activeTab = id;
    var tab = TABS.filter(function (t) { return t.id === id; })[0] || TABS[0];
    document.querySelectorAll(".side-btn").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-tab") === id); });
    document.getElementById("tabTitle").textContent = tab.label;
    document.getElementById("tabSub").textContent = tab.group === "Verwaltung" ? "Webseiten-Inhalte verwalten" : (tab.group === "Immobilien" ? "Immobilienverwaltung" : "StateV Firmenverwaltung");
    var c = document.getElementById("dashContent");
    if (id === "cms") return renderCms(c);
    if (id === "publish") return renderPublish(c);
    if (id === "options") return renderOptions(c);
    if (id === "buildings") return renderBuildings(c);
    c.innerHTML = loader();
    loadTab(id, c);
  }

  /* ======================================================================
     FIRMA TABS
     ====================================================================== */
  async function loadTab(id, c) {
    var map = {
      overview: "/firma/overview", inventory: "/firma/inventory", machine: "/firma/machine",
      counter: "/firma/counter", productions: "/firma/productions", vehicles: "/firma/vehicles",
      market: "/firma/marketoffers", buylog: "/firma/buylog?limit=25&skip=0", bank: "/firma/bankaccounts"
    };
    var res = await api(map[id]);
    if (!res.ok) { c.innerHTML = errState(res.data && res.data.detail); return; }
    var d = res.data;
    if (d && d._premium) { c.innerHTML = premiumBox(d.message); return; }

    if (id === "overview") {
      var cur = d.current || {};
      var kpis = [
        { ic: "factory", b: cur.name || "–", s: "Firma" },
        { ic: "shield-check", b: cur.isOpen ? "Geöffnet" : "Geschlossen", s: "Status" },
        { ic: "home", b: cur.address || "–", s: "Adresse" },
        { ic: "tag", b: cur.type || "–", s: "Typ" }
      ];
      c.innerHTML =
        '<div class="kpi-grid">' + kpis.map(function (k) {
          return '<div class="kpi glass"><div class="k-ic">' + icon(k.ic, 'width="20" height="20"') + "</div><b>" + escapeHtml(String(k.b)) + "</b><span>" + k.s + "</span></div>";
        }).join("") + "</div>" +
        '<div class="panel glass"><div class="panel-head"><h3>Eigene Firmen</h3>' + refreshBtn() + "</div>" + autoTable(d.all || []) + "</div>";
      bindRefresh(c, id);
      return;
    }
    if (id === "inventory") {
      c.innerHTML =
        '<div class="kpi-grid"><div class="kpi glass"><div class="k-ic">' + icon("box", 'width="20" height="20"') + "</div><b>" + fmt(d.totalWeight || 0) + "</b><span>Gesamtgewicht</span></div>" +
        '<div class="kpi glass"><div class="k-ic">' + icon("list", 'width="20" height="20"') + "</div><b>" + ((d.items || []).length) + "</b><span>Artikel</span></div></div>" +
        '<div class="panel glass"><div class="panel-head"><h3>Firmenlager</h3>' + refreshBtn() + "</div>" + autoTable(d.items || []) + "</div>";
      bindRefresh(c, id); return;
    }
    if (id === "market") {
      c.innerHTML =
        '<div class="panel glass"><div class="panel-head"><h3>Marktangebote · Verkauf</h3></div>' + renderAny(d.sell) + "</div>" +
        '<div class="panel glass"><div class="panel-head"><h3>Marktangebote · Ankauf</h3></div>' + renderAny(d.buy) + "</div>";
      return;
    }
    // generic
    c.innerHTML = '<div class="panel glass"><div class="panel-head"><h3>' + tabLabel(id) + "</h3>" + refreshBtn() + "</div>" + renderAny(d) + "</div>";
    bindRefresh(c, id);
  }

  function renderAny(d) {
    if (d && d._premium) return premiumBox(d.message);
    if (Array.isArray(d)) return autoTable(d);
    if (d && typeof d === "object") {
      var arrKey = Object.keys(d).filter(function (k) { return Array.isArray(d[k]); });
      if (arrKey.length === 1 && Object.keys(d).length <= 3) return autoTable(d[arrKey[0]]);
      return keyValueTable(d);
    }
    return emptyState("Keine Daten.");
  }
  function tabLabel(id) { var t = TABS.filter(function (x) { return x.id === id; })[0]; return t ? t.label : id; }
  function refreshBtn() { return '<button class="btn-sm ghost" data-refresh>' + icon("refresh", 'width="14" height="14" style="display:inline;vertical-align:-2px;margin-right:5px"') + "Aktualisieren</button>"; }
  function bindRefresh(c, id) { var b = c.querySelector("[data-refresh]"); if (b) b.addEventListener("click", function () { c.innerHTML = loader(); loadTab(id, c); }); }

  /* ======================================================================
     VERÖFFENTLICHEN (Push in StateV Page Options)
     ====================================================================== */
  async function renderPublish(c) {
    c.innerHTML =
      '<div class="panel glass" style="max-width:680px"><div class="panel-head"><h3>Inhalte veröffentlichen</h3></div>' +
        '<p style="color:var(--text-soft);font-size:.92rem;margin-bottom:18px">Überträgt alle Webseiten-Inhalte (Events, News, Galerie, Sehenswürdigkeiten, Arbeiten, Unternehmen, Freizeit) inkl. Bilder sowie den Firmen-Status in die StateV <b>Page Options</b> deiner Firma. Der öffentliche Guide liest diese Daten direkt aus der vAPI – StateV-konform, ohne eigenes Backend.</p>' +
        '<div id="pubStatus" style="margin-bottom:14px"></div>' +
        '<div id="pubEstimate" style="margin-bottom:18px"></div>' +
        '<button class="btn-sm primary" id="pubBtn" data-testid="publish-btn">' + icon("upload", 'width="15" height="15" style="display:inline;vertical-align:-2px;margin-right:6px"') + 'Jetzt veröffentlichen</button>' +
        '<div id="pubResult" style="margin-top:16px"></div>' +
      "</div>";
    var st = document.getElementById("pubStatus");
    st.innerHTML = loader();
    var s = await api("/publish/status");
    if (s.ok && s.data && s.data.published) {
      st.innerHTML = '<div class="cms-item"><div class="ci-main"><b>Status: Veröffentlicht</b><span>' +
        (s.data.len || 0) + ' Zeichen · ' + (s.data.chunks || 0) + ' Slot(s)' + (s.data.lastUpdated ? ' · zuletzt ' + escapeHtml(String(s.data.lastUpdated)) : "") + '</span></div><span class="pill">aktiv</span></div>';
    } else {
      st.innerHTML = '<div class="cms-item"><div class="ci-main"><b>Status: Noch nicht veröffentlicht</b><span>Klicke auf „Jetzt veröffentlichen", um die Inhalte zu übertragen.</span></div><span class="pill muted">inaktiv</span></div>';
    }

    // Auslastungs-Vorschau (Dry-Run, ohne zu schreiben)
    var est = document.getElementById("pubEstimate");
    est.innerHTML = loader();
    var btn = document.getElementById("pubBtn");
    var e = await api("/publish?dry=true", { method: "POST" });
    if (e.ok && e.data) {
      var d = e.data;
      var pct = Math.min(100, Math.round((d.slots / 10) * 100));
      var fits = d.fits;
      var barColor = fits ? (pct > 80 ? "var(--amber)" : "var(--teal)") : "var(--danger,#ef6f5e)";
      var cnt = d.counts || {};
      var cntStr = "Events " + (cnt.events || 0) + " · News " + (cnt.news || 0) + " · Galerie " + (cnt.gallery || 0) +
        " · Sehensw. " + (cnt.sights || 0) + " · Jobs " + (cnt.jobs || 0) +
        " · Unternehmen " + (cnt.companies || 0) + " · Freizeit " + (cnt.freizeit || 0);
      est.innerHTML =
        '<div class="panel" style="padding:16px;border:1px solid var(--border);border-radius:14px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b data-testid="publish-estimate">' + d.slots + ' / 10 Slots</b>' +
        '<span class="pill ' + (fits ? "" : "danger") + '" data-testid="publish-fits">' + (fits ? "passt" : "zu groß") + '</span></div>' +
        '<div class="usage-bar"><span style="width:' + pct + '%;background:' + barColor + '"></span></div>' +
        '<div class="usage-label">' + (d.bytes || 0) + ' Zeichen in ' + d.slots + ' Slot(s) (Slot 1 = Manifest)</div>' +
        '<div style="margin-top:8px;color:var(--text-dim);font-size:.8rem">' + cntStr + '</div>' +
        (fits ? "" : '<div class="login-note err" style="margin-top:12px" data-testid="publish-warning">Der Inhalt überschreitet die 10 verfügbaren Slots (24.000 Zeichen). Bitte Bilder/Texte kürzen oder VAPI Premium nutzen, sonst schlägt das Veröffentlichen fehl.</div>') +
        '</div>';
      if (!fits && btn) { btn.disabled = true; btn.style.opacity = ".5"; }
    } else {
      est.innerHTML = "";
    }

    document.getElementById("pubBtn").addEventListener("click", async function () {
      var b = this; b.disabled = true; b.style.opacity = ".6";
      var out = document.getElementById("pubResult"); out.innerHTML = loader();
      var res = await api("/publish", { method: "POST" });
      b.disabled = false; b.style.opacity = "1";
      if (res.ok) {
        toast("Inhalte veröffentlicht.");
        var cn = res.data.counts || {};
        out.innerHTML = '<div class="premium-box" style="border-color:rgba(54,214,198,.4);background:rgba(54,214,198,.05)"><div class="pb-ic" style="background:rgba(54,214,198,.12)">' + icon("upload", 'width="26" height="26"') + '</div>' +
          '<h4>Erfolgreich veröffentlicht</h4><p>' + (res.data.bytes || 0) + ' Zeichen in ' + (res.data.slots || 0) + ' Slot(s) · Events ' + (cn.events || 0) + ', News ' + (cn.news || 0) + ', Galerie ' + (cn.gallery || 0) + ', Sehensw. ' + (cn.sights || 0) + ', Jobs ' + (cn.jobs || 0) + ', Unternehmen ' + (cn.companies || 0) + ', Freizeit ' + (cn.freizeit || 0) + '</p></div>';
        renderPublish(c);
      } else {
        out.innerHTML = errState(res.data && res.data.detail);
        toast((res.data && res.data.detail) || "Veröffentlichen fehlgeschlagen.", "err");
      }
    });
  }

  /* ======================================================================
     OPTIONEN (lesen / schreiben)
     ====================================================================== */
  async function renderOptions(c) {
    c.innerHTML = loader();
    var res = await api("/firma/optionslots");
    if (!res.ok) { c.innerHTML = errState(res.data && res.data.detail); return; }
    var d = res.data;
    var pct = d.total ? Math.round((d.used / d.total) * 100) : 0;
    var rows = d.slots.map(function (s) {
      return "<tr><td class='cell-strong'>Slot " + s.slot + "</td><td>" +
        (s.used ? '<span class="pill">belegt</span>' : '<span class="pill muted">frei</span>') + "</td><td>" +
        escapeHtml(s.title || "–") + "</td><td>" + (s.length || 0) + " / 2400</td></tr>";
    }).join("");
    c.innerHTML =
      '<div class="kpi-grid"><div class="kpi glass"><div class="k-ic">' + icon("cog", 'width="20" height="20"') + '</div><b data-testid="slots-usage">' + d.used + " / " + d.total + "</b><span>Slots genutzt</span></div></div>" +
      '<div class="panel glass"><div class="panel-head"><h3>Auslastung der Page-Option-Slots</h3><button class="btn-sm ghost" id="optRefresh" data-testid="opt-refresh">Aktualisieren</button></div>' +
      '<div class="usage-bar"><span style="width:' + pct + '%"></span></div>' +
      '<div class="usage-label">' + d.used + " von " + d.total + " Slots belegt (" + pct + "%)</div>" +
      '<div class="tbl-wrap" style="margin-top:18px"><table class="tbl"><thead><tr><th>Slot</th><th>Status</th><th>Titel</th><th>Größe</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
      '<p style="margin-top:14px;color:var(--text-dim);font-size:.82rem">Slot 1 enthält das Manifest, Slots 2+ die Inhalts-Blöcke (vom „Veröffentlichen" befüllt). Ohne Premium stehen 10 Slots zur Verfügung.</p>' +
      "</div>";
    document.getElementById("optRefresh").addEventListener("click", function () { renderOptions(c); });
  }

  /* ======================================================================
     IMMOBILIEN
     ====================================================================== */
  async function renderBuildings(c) {
    c.innerHTML = loader();
    var res = await api("/buildings");
    if (!res.ok) { c.innerHTML = errState(res.data && res.data.detail); return; }
    var list = Array.isArray(res.data) ? res.data : (res.data && res.data._premium ? null : []);
    if (res.data && res.data._premium) { c.innerHTML = premiumBox(res.data.message); return; }
    if (!list.length) { c.innerHTML = '<div class="panel glass">' + emptyState("Keine Immobilien vorhanden.") + "</div>"; return; }
    c.innerHTML = '<div class="panel glass"><div class="panel-head"><h3>Eigene Immobilien</h3></div>' +
      list.map(function (b) {
        var id = b.id || b._id || b.buildingId;
        return '<div class="cms-item"><div class="ci-main"><b>' + escapeHtml(b.name || b.address || ("Immobilie " + id)) + "</b><span>" + escapeHtml(b.address || "") + "</span></div>" +
          '<div class="ci-actions"><button class="btn-sm ghost" data-bid="' + id + '">Details</button></div></div>';
      }).join("") + "</div><div id='bDetail'></div>";
    c.querySelectorAll("[data-bid]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        var id = btn.getAttribute("data-bid");
        var det = document.getElementById("bDetail");
        det.innerHTML = loader();
        var d = await api("/buildings/" + id + "/details");
        var t = await api("/buildings/" + id + "/tenants");
        var r = await api("/buildings/" + id + "/rooms");
        det.innerHTML =
          '<div class="panel glass"><div class="panel-head"><h3>Details</h3></div>' + (d.ok ? renderAny(d.data) : errState(d.data && d.data.detail)) + "</div>" +
          '<div class="panel glass"><div class="panel-head"><h3>Mieter</h3></div>' + (t.ok ? renderAny(t.data) : errState(t.data && t.data.detail)) + "</div>" +
          '<div class="panel glass"><div class="panel-head"><h3>Zimmer</h3></div>' + (r.ok ? renderAny(r.data) : errState(r.data && r.data.detail)) + "</div>";
        det.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  /* ======================================================================
     CMS (Events / News / Galerie)
     ====================================================================== */
  var cmsKind = "events";
  var FIELDS = {
    events: [
      { k: "title", l: "Titel" }, { k: "cat", l: "Kategorie (z. B. Sport)" },
      { k: "day", l: "Tag (z. B. 14)" }, { k: "mon", l: "Monat (z. B. Jun)" },
      { k: "time", l: "Uhrzeit (z. B. 22:00 Uhr)" }, { k: "place", l: "Ort" },
      { k: "bg", l: "Hintergrundbild-URL (pic.statev.de, optional)" },
      { k: "text", l: "Beschreibung", area: true }
    ],
    news: [
      { k: "title", l: "Titel" },
      { k: "tag", l: "Typ", select: ["news", "mayor", "police", "event"] },
      { k: "tagLabel", l: "Label (z. B. Stadt-News)" },
      { k: "meta", l: "Meta (z. B. Heute · Rathaus)" },
      { k: "feature", l: "Großer Beitrag (Hervorhebung)", bool: true },
      { k: "text", l: "Text", area: true }
    ],
    gallery: [
      { k: "cap", l: "Bildunterschrift" },
      { k: "img", l: "Bild-URL (pic.statev.de) ODER lokaler Dateiname ohne Endung – leer lassen für Farbverlauf" },
      { k: "grad", l: "Farbverlauf (CSS, optional, z. B. linear-gradient(135deg,#f5b942,#ef6f5e))" },
      { k: "ar", l: "Seitenverhältnis (z. B. 1 oder 1.5)" }
    ],
    sights: [
      { k: "title", l: "Titel" }, { k: "cat", l: "Kategorie (z. B. Wahrzeichen)" },
      { k: "img", l: "Bild-URL (pic.statev.de) ODER lokaler Dateiname ohne Endung" },
      { k: "desc", l: "Beschreibung", area: true }
    ],
    jobs: [
      { k: "title", l: "Titel" },
      { k: "icon", l: "Symbol", select: ["trash", "bus", "tram", "car", "fish", "tractor", "axe", "pickaxe", "truck", "target"] },
      { k: "diff", l: "Schwierigkeit (1–5)", select: ["1", "2", "3", "4", "5"] },
      { k: "pay", l: "Verdienst (z. B. €€ Mittel)" },
      { k: "beginner", l: "Für Anfänger geeignet", bool: true },
      { k: "img", l: "Bild-URL (pic.statev.de, optional)" },
      { k: "desc", l: "Beschreibung", area: true }
    ],
    companies: [
      { k: "title", l: "Titel" }, { k: "type", l: "Typ (z. B. Gastronomie)" },
      { k: "icon", l: "Symbol", select: ["utensils", "wrench", "car", "fuel", "bed", "music"] },
      { k: "img", l: "Bild-URL (pic.statev.de, optional)" },
      { k: "desc", l: "Beschreibung", area: true }
    ],
    freizeit: [
      { k: "title", l: "Titel" },
      { k: "icon", l: "Symbol", select: ["dice", "wine", "music", "target", "flag", "film", "fish", "mountain"] },
      { k: "img", l: "Bild-URL (pic.statev.de, optional)" },
      { k: "desc", l: "Kurzbeschreibung" },
      { k: "long", l: "Langtext (Popup)", area: true }
    ]
  };

  function renderCms(c) {
    var tabs = [["events", "Events", "calendar"], ["news", "News", "newspaper"], ["gallery", "Galerie", "image"],
      ["sights", "Sehenswürdigkeiten", "camera"],
      ["jobs", "Arbeiten", "briefcase"], ["companies", "Unternehmen", "store"], ["freizeit", "Freizeit", "dice"]];
    c.innerHTML =
      '<div class="cms-tabs">' + tabs.map(function (t) {
        return '<button class="btn-sm ' + (cmsKind === t[0] ? "primary" : "ghost") + '" data-cms="' + t[0] + '" data-testid="cms-tab-' + t[0] + '">' + icon(t[2], 'width="14" height="14" style="display:inline;vertical-align:-2px;margin-right:6px"') + t[1] + "</button>";
      }).join("") + "</div>" +
      '<div class="cms-actions"><button class="btn-sm ghost" id="cmsPreview" data-testid="cms-preview-btn">' + icon("globe", 'width="14" height="14" style="display:inline;vertical-align:-2px;margin-right:6px"') + 'Vorschau dieser Seite (Entwurf)</button></div>' +
      '<div id="cmsList"></div>' +
      '<div class="panel glass" id="cmsForm" style="max-width:680px"></div>';
    c.querySelectorAll("[data-cms]").forEach(function (b) {
      b.addEventListener("click", function () { cmsKind = b.getAttribute("data-cms"); renderCms(c); });
    });
    document.getElementById("cmsPreview").addEventListener("click", function () { openPreview(cmsKind); });
    loadCmsList();
    renderCmsForm(null);
  }

  var PREVIEW_PAGES = { events: "events", news: "index", gallery: "galerie", sights: "sehenswuerdigkeiten", jobs: "arbeiten", companies: "unternehmen", freizeit: "freizeit" };

  function openPreview(kind) {
    var pageName = PREVIEW_PAGES[kind] || "index";
    var base = (window.ADMIN_API_BASE || "").replace(/\/$/, "");
    var src = base + "/" + pageName + ".html?previewApi=" + encodeURIComponent(window.ADMIN_API_BASE || "");
    var back = document.createElement("div");
    back.className = "preview-backdrop";
    back.setAttribute("data-testid", "preview-modal");
    back.innerHTML = '<div class="preview-modal"><div class="pv-head"><b>Vorschau · ' + pageName + '.html <span class="pv-note">(Entwurf – noch nicht veröffentlicht)</span></b>' +
      '<button class="btn-sm ghost" id="pvClose" data-testid="preview-close">Schließen</button></div>' +
      '<iframe src="' + src + '" title="Vorschau" data-testid="preview-iframe"></iframe></div>';
    document.body.appendChild(back);
    function close() { back.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); }
    back.addEventListener("click", function (e) { if (e.target === back || e.target.closest("#pvClose")) close(); });
    document.addEventListener("keydown", onKey);
  }

  async function loadCmsList() {
    var host = document.getElementById("cmsList");
    host.innerHTML = loader();
    var res = await api("/content/" + cmsKind);
    if (!res.ok) { host.innerHTML = errState(res.data && res.data.detail); return; }
    var items = res.data || [];
    if (!items.length) { host.innerHTML = '<div class="panel glass">' + emptyState("Noch keine Einträge.") + "</div>"; return; }
    host.innerHTML = '<div class="cms-list">' + items.map(function (it) {
      var title = it.title || it.cap || "(ohne Titel)";
      var sub = cmsKind === "gallery" ? (it.img ? "Bild: " + it.img : "Farbverlauf")
        : (it.desc || it.meta || it.cat || it.type || it.text || "");
      var thumb = "";
      if (it.img || (cmsKind === "gallery" && it.grad)) {
        var src = it.img ? (/^https?:\/\//.test(it.img) ? it.img : "images/" + it.img + ".png") : null;
        var bg = src ? "url('" + src + "')" : (it.grad || "var(--surface)");
        thumb = '<div class="cms-grid-thumb" style="background:' + bg + ';background-size:cover;background-position:center"></div>';
      }
      return '<div class="cms-item">' + thumb + '<div class="ci-main" style="flex:1"><b>' + escapeHtml(title) + "</b><span>" + escapeHtml(String(sub).slice(0, 80)) + "</span></div>" +
        '<div class="ci-actions"><button class="btn-sm ghost" data-edit="' + it.id + '">Bearbeiten</button>' +
        '<button class="btn-sm danger" data-del="' + it.id + '">Löschen</button></div></div>';
    }).join("") + "</div>";

    host.querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { var it = items.filter(function (x) { return x.id === b.getAttribute("data-edit"); })[0]; renderCmsForm(it); document.getElementById("cmsForm").scrollIntoView({ behavior: "smooth", block: "center" }); });
    });
    host.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", async function () {
        if (!confirm("Diesen Eintrag wirklich löschen?")) return;
        var res = await api("/content/" + cmsKind + "/" + b.getAttribute("data-del"), { method: "DELETE" });
        if (res.ok) { toast("Eintrag gelöscht."); loadCmsList(); } else toast((res.data && res.data.detail) || "Fehler.", "err");
      });
    });
  }

  function renderCmsForm(item) {
    var editing = !!item;
    var fields = FIELDS[cmsKind];
    var form = document.getElementById("cmsForm");
    form.innerHTML =
      '<div class="panel-head"><h3>' + (editing ? "Eintrag bearbeiten" : "Neuen Eintrag anlegen") + "</h3>" +
      (editing ? '<button class="btn-sm ghost" id="cmsCancel">Abbrechen</button>' : "") + "</div>" +
      fields.map(function (f) {
        var v = item ? (item[f.k] !== undefined ? item[f.k] : "") : "";
        if (f.bool) return '<div class="field"><label>' + f.l + '</label><select data-f="' + f.k + '"><option value="false"' + (!v ? " selected" : "") + '>Nein</option><option value="true"' + (v ? " selected" : "") + ">Ja</option></select></div>";
        if (f.select) return '<div class="field"><label>' + f.l + '</label><select data-f="' + f.k + '">' + f.select.map(function (o) { return '<option value="' + o + '"' + (v === o ? " selected" : "") + ">" + o + "</option>"; }).join("") + "</select></div>";
        if (f.area) return '<div class="field"><label>' + f.l + '</label><textarea data-f="' + f.k + '">' + escapeHtml(String(v)) + "</textarea></div>";
        return '<div class="field"><label>' + f.l + '</label><input data-f="' + f.k + '" value="' + escapeHtml(String(v)) + '" /></div>';
      }).join("") +
      '<div class="form-actions"><button class="btn-sm primary" id="cmsSave" data-testid="cms-save">' + (editing ? "Aktualisieren" : "Anlegen") + "</button></div>";

    if (editing) document.getElementById("cmsCancel").addEventListener("click", function () { renderCmsForm(null); });
    document.getElementById("cmsSave").addEventListener("click", async function () {
      var payload = {};
      form.querySelectorAll("[data-f]").forEach(function (el) {
        var k = el.getAttribute("data-f"); var val = el.value;
        if (val === "true") val = true; else if (val === "false") val = false;
        else if (k === "ar" && val !== "") val = parseFloat(val) || 1;
        else if (k === "diff" && val !== "") val = parseInt(val, 10) || 1;
        else if ((k === "x" || k === "y") && val !== "") val = Math.round(parseFloat(val) * 10) / 10;
        payload[k] = val;
      });
      if (!payload.title && !payload.cap) return toast("Bitte mindestens einen Titel angeben.", "err");
      var res = editing
        ? await api("/content/" + cmsKind + "/" + item.id, { method: "PUT", body: payload })
        : await api("/content/" + cmsKind, { method: "POST", body: payload });
      if (res.ok) { toast(editing ? "Gespeichert." : "Eintrag angelegt."); renderCmsForm(null); loadCmsList(); }
      else toast((res.data && res.data.detail) || "Fehler beim Speichern.", "err");
    });
  }

  /* ======================================================================
     INIT
     ====================================================================== */
  (async function init() {
    var me = await api("/auth/me");
    if (me.ok) { user = me.data; renderDash(); }
    else { renderLogin(); }
  })();
})();
