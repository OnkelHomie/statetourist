/* ==========================================================================
   StateV Konfiguration für den öffentlichen Guide.
   Diese Datei ist LOKAL (StateV-konform) und enthält nur LESE-Zugriff.
   Der Guide liest die vom Admin veröffentlichten Inhalte aus den
   StateV Page Options (Slots) der Firma.

   WICHTIG / SICHERHEIT:
   - Trage hier idealerweise einen API-Key mit NUR Lese-Scopes ein
     (factory, factory.options). Das API-SECRET gehört NICHT hierher –
     es bleibt ausschließlich im Admin-Backend.
   - Ist "apiKey" leer, nutzt der Guide die eingebauten Standardinhalte.
   ========================================================================== */
window.STATEV_CONFIG = {
  base: "https://api.statev.dev/req",
  firmaId: "66c49041a0249051d20c3e7c",
  apiKey: "RK0853T3G3494BXJ5P"
};
