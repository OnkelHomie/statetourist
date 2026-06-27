# PRD — StateV · Los Santos Touristen- & Stadtführer

## Problem Statement
Vollständig responsive, moderne Tourismus-/Stadtführer-Webseite für den StateV Ingame Browser (Los Santos & San Andreas). Zielgruppe: neue + erfahrene Spieler. Strenge Regeln: ausschließlich Plain HTML/CSS/JS, kein Backend, keine DB, keine externen APIs/Fonts/CDN/Frameworks, alle Assets lokal, Platz für StateV-Verifizierungssiegel im Footer.

## Architektur
- 100% statisch, framework-frei. **Multi-Page** (echte Unterseiten, keine SPA). Geliefert in `/app/frontend/public/` (Live-Vorschau) und als Standalone-Kopie `/app/statev-site/` + ZIP `/app/statev-los-santos.zip`.
- 11 HTML-Seiten: `index.html` (Start), `entdecken`, `arbeiten`, `nahverkehr`, `sehenswuerdigkeiten`, `freizeit`, `unternehmen`, `events`, `guide`, `faq`, `galerie`. Jede Seite ist ein schlankes Skelett mit `<body data-page="...">` + `<main id="app">`.
- `css/styles.css` (Dark/Glassmorphism Design-System), `js/main.js` (zentrale DATA, Icon-Sprite, Navigation & Footer werden per JS injiziert = DRY; seitenspezifischer Inhalt wird anhand von `data-page` gerendert; IntersectionObserver Scroll-Reveal, FAQ-Accordion, Event-Filter, interaktive Karte, Mobile-Nav, Back-to-Top).
- React-Entry (App.js) auf `return null` gesetzt + index.css/App.css geleert, damit die Preview die statische Seite sauber ausliefert (nur index.html erhält ein inaktives Bundle; Unterseiten werden 100% statisch ausgeliefert).
- Bilder lokal generiert (Hero, 8 Sehenswürdigkeiten, stilisierte Karte) in `images/`.

## Implementiert (2026-06-27)
- Sticky-Navigation mit allen geforderten Punkten + aktivem Scroll-Spy.
- Hero mit großem Bild, CTA-Buttons, Stats.
- Aktuelles (Bento-News), Eventkalender (filterbare Karten), Stadt entdecken (interaktive Karte mit Kategorie-Markern + Ortskarten), Arbeiten (10 Berufe mit Schwierigkeit/Verdienst/Anfänger-Badge), Nahverkehr (Bus-/Tram-Linien mit Haltestellen & Zeiten), Sehenswürdigkeiten (8 Bildkarten), Freizeit (Kacheln), Unternehmen (Karten mit Logo-Platzhalter), Anfänger-Guide (8-Schritt-Timeline), FAQ (Accordion), Galerie (Masonry).
- Footer mit Navigation, Copyright, Impressum/Kontakt + dediziertem StateV-Verifizierungssiegel-Platzhalter.
- Animationen: Fade-In/Scroll-Reveal, Hover-Lift, weiche Übergänge.
- Verifiziert per Screenshot/Interaktionstest (Karte, Event-Filter, FAQ, Mobile-Nav, Responsiveness).

## StateV API + Admin (2026-06-27)
- **Backend (FastAPI, /app/backend/server.py):** Proxy zur StateV vAPI (`https://api.statev.dev/req`, Bearer-Key sicher in backend/.env). Endpoints `/api/firma/*` (overview, inventory, machine, counter, productions, vehicles, marketoffers, buylog, bankaccounts, options GET/POST), `/api/buildings/*`, alle per Discord-JWT-Cookie geschützt. Premium-gesperrte Endpoints → 200 mit `_premium:true`. Leere-Zustand-404 (z. B. „Counter is empty") werden zu leerem 200 normalisiert.
- **Auth:** Discord OAuth2 (Authorization Code, scope identify) → JWT-Cookie `sv_admin` (HTTP-only, secure). Zugriff via Allowlist `ADMIN_DISCORD_IDS` (leer = jeder eingeloggte Discord-User). Endpoints `/api/auth/login`, `/api/auth/discord/callback`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/config`.
- **CMS (MongoDB):** `/api/content/{events|news|gallery}` – GET öffentlich, POST/PUT/DELETE admin. Auto-Seeding der Standardinhalte. Der öffentliche Guide (main.js `loadContent`) lädt diese mit Fallback.
- **Admin-Frontend (/admin.html, js/admin.js, css/admin.css):** Discord-Login-Gate, Dashboard im Guide-Design mit Tabs: Firma (Übersicht/Lager/Maschinen/Theke/Produktionen/Fahrzeuge/Marktangebote/Verkaufslog/Bankkonten/Optionen), Immobilien, Webseite-CMS (Events/News/Galerie CRUD).
- **Getestet:** Backend 13/14→14/14 (counter-Fix), Admin-UI 100% (Dashboard, KPIs, Premium-Box, CMS-CRUD, Logout, Guide liest CMS). Discord-OAuth-Flow nicht automatisiert getestet (echtes Login nötig).
- **Offen (benötigt User):** DISCORD_CLIENT_ID/SECRET + Redirect-URI registrieren, ADMIN_DISCORD_IDS setzen.

## Content-Push via StateV Page Options + Separates Admin (2026-06-27)
- **Erkenntnis:** vAPI hat keinen generischen Content-Endpoint, aber **Page Options** (10 Slots/Firma, Premium 20; je title≤64, data≤2400) sind als „Speicher für externe Webseiten" gedacht. Schreiben: `POST /factory/options` (braucht **API-Secret**). Lesen: `GET /factory/options/{firmenId}/{option}` (nur Bearer). CORS offen (`*`).
- **Push-Mechanismus:** Admin „Veröffentlichen" (`POST /api/publish`) serialisiert Events/News/Galerie + Firmen-Snapshot zu minified JSON, chunkt es (2300 Zeichen) über Slot 1 (Manifest `{c,len}`) + Slots 2..N und schreibt via API-Secret.
- **Guide liest live:** `js/config.js` (lokal, nur Lese-Key) → `main.js loadFromVapi()` liest Manifest + Chunks aus der vAPI (einzige erlaubte API ingame), rekonstruiert JSON, überschreibt Inhalte; Fallback auf Standarddaten. Firma-Live-Status-Karte auf der Unternehmen-Seite.
- **Admin SEPARAT & deploybar:** eigenständiges Paket `/app/admin-site/` + `statev-admin.zip` (admin.html, css, js/admin.js, js/admin-config.js mit `ADMIN_API_BASE`, README). Cookie auf `SameSite=None; Secure` für Cross-Origin. Backend: `ADMIN_BASE_URL` (Login-Redirect-Ziel) konfigurierbar.
- **Getestet:** Dashboard inkl. „Veröffentlichen"-Tab, Publish-Fehlerfall (API-Secret fehlt → 503 sauber), Guide macht genau 1 vAPI-Aufruf + Fallback, Unternehmen-Seite rendert.
- **Offen (User):** `STATEV_API_SECRET` (für Push), Discord-Creds + Redirect-URI, `ADMIN_DISCORD_IDS`.

## Bilder & CMS für ALLE Sektionen + Slot-Warnung (2026-06-27)
- **CMS erweitert auf 8 Sektionen:** Neben Events/News/Galerie sind jetzt auch Sehenswürdigkeiten (sights), Stadt entdecken (places), Arbeiten (jobs), Unternehmen (companies) und Freizeit (freizeit) vollständig über das Admin-CMS verwaltbar – inkl. Bild-URL-Feld (pic.statev.de oder lokaler Bildname). Backend: `VALID_KINDS`, CRUD `/api/content/{kind}`, Seeding.
- **Veröffentlichen (`POST /api/publish`):** `_build_bundle()` serialisiert nun alle 8 Sektionen + Firmen-Snapshot zu minified JSON, chunkt über Page-Option-Slots (Slot 1 Manifest, 2..N Daten). Nicht mehr benötigte Slots werden beim Schrumpfen geleert.
- **Slot-Warnung (P1):** `POST /api/publish?dry=true` (Dry-Run) liefert `bytes`, `slots`, `fits`, `counts` ohne zu schreiben. Admin „Veröffentlichen"-Ansicht zeigt Auslastungs-Balken „n / 10 Slots", „passt"/„zu groß" und warnt vor Überschreitung (data-testids: publish-estimate, publish-fits, publish-warning). Echtes Publish blockt bei >10 Slots (413).
- **Guide-Rendering:** `cardMedia()` erzeugt Bild-Header (`.card-media`); job-/company-/freizeit-/place-/sight-Karten zeigen Bilder einheitlich. `loadFromVapi()` wendet alle 8 Sektionen an. Guide rendert sofort Standarddaten und re-rendert flackerfrei nach asynchronem vAPI-Laden (firstRender-Flag, reveals beim Re-Render sofort sichtbar). Geladen auf start/events/galerie/unternehmen/sehenswuerdigkeiten/arbeiten/entdecken/freizeit.
- **Getestet (iteration_2):** 27/27 Backend-pytest grün; Admin 8 CMS-Tabs + Bild-Formular + Publish-Estimate; 5 Guide-Seiten rendern Seed-Inhalte; Bild-Header (Bayview/casino) erscheint. Keine Defekte.
- **Pakete:** `statev-los-santos.zip` (Guide via statev-site) + `statev-admin.zip` (admin-site) neu gepackt; frontend/public-Kopien synchron.

## Backlog / Next
- P0: Discord-Credentials hinterlegen, damit der Admin-Login live funktioniert.
- P1: Reales StateV-Verifizierungssiegel-Bild einsetzen (Platzhalter vorhanden).
- P1: VAPI Premium für Bankkonten/Transaktionen (aktuell serverseitig gesperrt).
- P2: Bild-Upload (Object Storage) statt Dateiname/Verlauf im Galerie-CMS.
- P2: In-Game-Koordinaten für Kartenmarker; DE/EN-Sprachumschalter.
