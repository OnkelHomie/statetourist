# PRD — StateV · Los Santos Touristen- & Stadtführer

## Problem Statement
Vollständig responsive, moderne Tourismus-/Stadtführer-Webseite für den StateV Ingame Browser (Los Santos & San Andreas). Zielgruppe: neue + erfahrene Spieler. Strenge Regeln: ausschließlich Plain HTML/CSS/JS, kein Backend, keine DB, keine externen APIs/Fonts/CDN/Frameworks, alle Assets lokal, Platz für StateV-Verifizierungssiegel im Footer.

## Architektur
- 100% statisch, framework-frei. Geliefert in `/app/frontend/public/` (Live-Vorschau) und als Standalone-Kopie `/app/statev-site/` + ZIP `/app/statev-los-santos.zip`.
- `index.html` (semantisches HTML5 + Inline-SVG-Icon-Sprite), `css/styles.css` (Dark/Glassmorphism Design-System mit CSS-Variablen), `js/main.js` (Vanilla JS: zentrale DATA-Objekte → Rendering, IntersectionObserver Scroll-Reveal, Scroll-Spy, FAQ-Accordion, Event-Filter, interaktive Karten-Kategorien, Mobile-Nav, Back-to-Top).
- React-Entry (App.js) auf `return null` gesetzt + index.css/App.css geleert, damit die Preview die statische Seite sauber ausliefert.
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
