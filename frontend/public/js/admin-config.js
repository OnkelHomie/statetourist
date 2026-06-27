/* ==========================================================================
   StateV Admin – Konfiguration
   ADMIN_API_BASE: Basis-URL des Backends.
   - Leer lassen ("") wenn Admin & Backend auf DERSELBEN Domain laufen
     (z. B. in dieser Vorschau) -> relative /api Aufrufe.
   - Beim SEPARATEN Hosting hier die Backend-URL eintragen, z. B.
     "https://api.deinedomain.tld" (ohne abschließenden /).
     Zusätzlich im Backend CORS_ORIGINS auf die Admin-Domain setzen
     und ADMIN_BASE_URL auf die Admin-URL (für den Login-Redirect).
   ========================================================================== */
window.ADMIN_API_BASE = "";
