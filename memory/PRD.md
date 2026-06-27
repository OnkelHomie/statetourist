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

## Backlog / Next
- P0: Discord-Credentials hinterlegen, damit der Admin-Login live funktioniert.
- P1: Reales StateV-Verifizierungssiegel-Bild einsetzen (Platzhalter vorhanden).
- P1: VAPI Premium für Bankkonten/Transaktionen (aktuell serverseitig gesperrt).
- P2: Bild-Upload (Object Storage) statt Dateiname/Verlauf im Galerie-CMS.
- P2: In-Game-Koordinaten für Kartenmarker; DE/EN-Sprachumschalter.
