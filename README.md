# Business Central Debugging Book

Dieses Repository enthaelt das **Business Central Debugging Book & Evidence System**.

Der aktive Buchbereich liegt in:

```text
debugging-book/
```

Wichtige Regeln:

- Production ist grundsaetzlich read-only.
- Keine Buchungen, Stornos, Zahlungen, E-Mails, Job-Queue-Starts oder Integrationslaeufe ohne ausdrueckliche Freigabe.
- Evidence Packs liegen unter `debugging-book/evidence/`.
- Die Playwright-Grundstruktur im Root prueft Templates, Safe-Action-Policy und optionale read-only BC-Smokes.

Start:

```powershell
npm install
npm run check:evidence
npm run check:safe-policy
```
