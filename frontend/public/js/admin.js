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
    opts.credentials = "same-origin";
    if (opts.body && typeof opts.body !== "string") opts.body = JSON.stringify(opts.body);
    opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    var r, data = null;
    try { r = await fetch("/api" + path, opts); } catch (e) { return { ok: false, status: 0, data: { detail: "Netzwerkfehler" } }; }
    try { data = await r.json(); } catch (e) {}
    return { ok: r.ok, status: r.status, data: data };
  }

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
          ? '<a class="btn-discord" data-testid="discord-login-btn" href="/api/auth/login">' + icon("discord", 'width="22" height="22"') + " Mit Discord anmelden</a>"
          : '<div class="login-note warn">' + icon("alert", 'width="16" height="16" style="display:inline;vertical-align:-3px;margin-right:6px"') + " Discord-Login ist noch nicht konfiguriert. Bitte Client-ID & Secret im Backend hinterlegen.</div>") +
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
    { id: "cms", label: "Webseite", icon: "globe", group: "Verwaltung" }
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
     OPTIONEN (lesen / schreiben)
     ====================================================================== */
  function renderOptions(c) {
    c.innerHTML =
      '<div class="panel glass" style="max-width:620px"><div class="panel-head"><h3>Firmenoption lesen / bearbeiten</h3></div>' +
        '<div class="field"><label>Option (Name/Key)</label><input id="optKey" placeholder="z. B. autoOpen" data-testid="opt-key" /></div>' +
        '<div class="form-actions"><button class="btn-sm ghost" id="optRead" data-testid="opt-read">Lesen</button></div>' +
        '<div id="optReadOut" style="margin:14px 0"></div>' +
        '<div class="field"><label>Neuer Wert</label><input id="optVal" placeholder="Wert" data-testid="opt-val" /></div>' +
        '<div class="form-actions"><button class="btn-sm primary" id="optSave" data-testid="opt-save">Speichern</button></div>' +
        '<p style="margin-top:14px;color:var(--text-dim);font-size:.82rem">Hinweis: Verfügbare Optionen hängen vom Firmentyp ab. Der Wert wird per <code>POST /factory/options</code> gespeichert.</p>' +
      "</div>";
    document.getElementById("optRead").addEventListener("click", async function () {
      var key = document.getElementById("optKey").value.trim();
      var out = document.getElementById("optReadOut");
      if (!key) return toast("Bitte einen Options-Namen eingeben.", "err");
      out.innerHTML = loader();
      var res = await api("/firma/options/" + encodeURIComponent(key));
      out.innerHTML = res.ok ? renderAny(res.data) : errState(res.data && res.data.detail);
    });
    document.getElementById("optSave").addEventListener("click", async function () {
      var key = document.getElementById("optKey").value.trim();
      var val = document.getElementById("optVal").value;
      if (!key) return toast("Bitte einen Options-Namen eingeben.", "err");
      var res = await api("/firma/options", { method: "POST", body: { option: key, value: val } });
      if (res.ok) toast("Option gespeichert."); else toast((res.data && res.data.detail) || "Fehler beim Speichern.", "err");
    });
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
      { k: "img", l: "Bild-Dateiname ohne Endung (z. B. hero) – leer lassen für Farbverlauf" },
      { k: "grad", l: "Farbverlauf (CSS, optional, z. B. linear-gradient(135deg,#f5b942,#ef6f5e))" },
      { k: "ar", l: "Seitenverhältnis (z. B. 1 oder 1.5)" }
    ]
  };

  function renderCms(c) {
    var tabs = [["events", "Events", "calendar"], ["news", "News", "newspaper"], ["gallery", "Galerie", "image"]];
    c.innerHTML =
      '<div class="cms-tabs">' + tabs.map(function (t) {
        return '<button class="btn-sm ' + (cmsKind === t[0] ? "primary" : "ghost") + '" data-cms="' + t[0] + '" data-testid="cms-tab-' + t[0] + '">' + icon(t[2], 'width="14" height="14" style="display:inline;vertical-align:-2px;margin-right:6px"') + t[1] + "</button>";
      }).join("") + "</div>" +
      '<div id="cmsList"></div>' +
      '<div class="panel glass" id="cmsForm" style="max-width:680px"></div>';
    c.querySelectorAll("[data-cms]").forEach(function (b) {
      b.addEventListener("click", function () { cmsKind = b.getAttribute("data-cms"); renderCms(c); });
    });
    loadCmsList();
    renderCmsForm(null);
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
      var sub = cmsKind === "gallery" ? (it.img ? "Bild: " + it.img : "Farbverlauf") : (it.meta || it.cat || it.text || "");
      var thumb = "";
      if (cmsKind === "gallery") {
        var bg = it.img ? "url('images/" + it.img + ".png')" : (it.grad || "var(--surface)");
        thumb = '<div class="cms-grid-thumb" style="background:' + bg + ';background-size:cover"></div>';
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
