# StateV Admin (separates Tool)

Eigenständige Admin-Oberfläche für die StateV-Firmenverwaltung + Webseiten-CMS.
Läuft als reine statische Seite (HTML/CSS/JS) und spricht das Backend per API an.
**Dieses Paket ist getrennt vom öffentlichen Guide** und gehört NICHT in den StateV-Ingame-Browser.

## Dateien
- `admin.html` – Einstieg (Discord-Login + Dashboard)
- `css/styles.css` – Design-Tokens (geteilt mit dem Guide-Look)
- `css/admin.css` – Dashboard-Styles
- `js/admin-config.js` – **hier die Backend-URL eintragen** (`window.ADMIN_API_BASE`)
- `js/admin.js` – gesamte Dashboard-Logik

## Deployment (separat von Backend)
1. Diese Dateien auf einen beliebigen Static-Host/Webserver legen (z. B. https://admin.deinedomain.tld).
2. In `js/admin-config.js` `ADMIN_API_BASE` auf die Backend-URL setzen (ohne `/` am Ende).
3. Im Backend `.env` setzen:
   - `ADMIN_BASE_URL` = URL dieser Admin-Seite (für den Login-Redirect), z. B. `https://admin.deinedomain.tld`
   - `CORS_ORIGINS` = dieselbe Admin-URL (für credentialed CORS; KEIN `*`, da Cookie-Login)
   - `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `ADMIN_DISCORD_IDS`
   - `STATEV_API_SECRET` (für „Veröffentlichen" / Page-Options schreiben)
4. Im Discord Developer Portal als OAuth2-Redirect eintragen:
   `<BACKEND-URL>/api/auth/discord/callback`

## Hinweis
- Das Login nutzt ein HTTP-only Cookie (SameSite=None; Secure) → Admin & Backend müssen über HTTPS laufen.
- Der API-Key/-Secret bleibt ausschließlich im Backend. Diese Admin-Seite enthält keine StateV-Secrets.
