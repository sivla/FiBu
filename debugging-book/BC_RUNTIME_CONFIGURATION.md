# BC Runtime Configuration

## Ziel

Die Runtime-Konfiguration bereitet optionale read-only Zugriffe auf Business Central vor. Sie erzwingt keinen Login und braucht lokal keine echten BC-Daten. Ohne `.env` laufen die lokalen Governance-, Template-, Privacy-, Runtime-, API- und Scaffold-Checks weiter.

## Optionale Variablen

UI-Smoke:

```env
BC_URL=
BC_ENVIRONMENT=
BC_COMPANY=
BC_USERNAME=
BC_AUTH_STATE_PATH=
```

API/OData-Strategie:

```env
BC_TENANT_ID=
BC_CLIENT_ID=
BC_CLIENT_SECRET=
BC_SCOPE=
BC_API_BASE_URL=
```

Safety:

```env
BC_ALLOW_WRITE=false
BC_ALLOW_PRODUCTION_WRITE=false
```

`BC_URL` reicht, damit der optionale UI-Smoke als konfiguriert gilt. `BC_API_BASE_URL` reicht, damit die API/OData-Konfiguration als vorhanden gilt. Fehlende Zusatzwerte sind Warnungen, keine lokalen Build-Fehler.

## Checks ohne BC-Zugriff

Diese Checks laufen lokal ohne Login, ohne `.env` und ohne echte BC-Daten:

```powershell
npm run check:debugging-book
npm run check:evidence
npm run check:safe-policy
npm run check:templates
npm run check:privacy
npm run check:runtime
npm run check:api
npm run check:scaffold
```

## Checks mit BC-Zugriff

`npm run bc:sample` braucht mindestens `BC_URL` und normalerweise einen lokalen Auth-State. Ohne `BC_URL` wird der Test uebersprungen. Der Test darf nur den Role Center read-only oeffnen, kompakten Text in `test-results/` schreiben und keine kritischen Buttons klicken.

## Production bleibt read-only

Production ist Belegquelle, nicht Testflaeche. Erlaubt sind Navigation, Page Inspection, strukturierte Lesezugriffe und anonymisierte Evidence. Nicht erlaubt sind Buchungen, Stornos, Zahlungen, E-Mails, Job Queue, Integrationen, Setup-, Stammdaten- oder Berechtigungsaenderungen.

## Auth-State und Secrets

Auth-State-Dateien liegen lokal, zum Beispiel unter `playwright/.auth/`, und sind durch `.gitignore` ausgeschlossen. `.env`, Auth-State, Cookies, Tokens, Client Secrets und Connection Strings duerfen niemals committed werden.

Das Runtime-Modul liest Pfade und Variablen nur ein. Es schreibt keine Auth-State-Dateien und gibt Secrets nicht unmaskiert in Warnungen oder Fehlern aus.
