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

## Backlog / Next
- P1: Reales StateV-Verifizierungssiegel-Bild einsetzen (Platzhalter vorhanden).
- P2: Echte In-Game-Standortkoordinaten für Kartenmarker; Galerie um echte Community-Bilder erweitern.
- P2: Optionaler DE/EN-Sprachumschalter.
