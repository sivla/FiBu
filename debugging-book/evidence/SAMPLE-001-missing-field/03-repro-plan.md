# Repro Plan

## Ziel

Nachstellen, ob `Lagerortcode` / `Location Code` im Verkaufszeilenbereich nur ausgeblendet ist oder technisch fehlt.

## Schritte

1. Environment klaeren: Production, Sandbox oder Test.
2. Wenn Production: nur read-only pruefen.
3. Verkaufsauftrag oeffnen, keine Daten aendern.
4. Screenshot der sichtbaren Verkaufszeilen sichern.
5. Page Inspection oeffnen und Page, Source Table und Feldkontext dokumentieren.
6. Personalisieren pruefen: ist `Location Code` als hinzufuegbares Feld verfuegbar?
7. Profil/Rollenlayout mit anderem User oder Testprofil vergleichen.
8. Falls noetig, Effective Permissions read-only pruefen.
9. Ursache und Grenze dokumentieren.

## Stop-Kriterien

- Environment unklar.
- User arbeitet in Production und eine Aenderung waere noetig.
- Personalisierung wuerde produktives User-Layout veraendern und ist nicht freigegeben.
- echte Kundendaten im Screenshot sind nicht anonymisiert.
