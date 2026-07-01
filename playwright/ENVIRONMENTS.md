# Business-Central-Umgebungen

Diese Datei beschreibt, wie neue Business-Central-Umgebungen in diesem Repository dokumentiert werden. Sie enthält keine Secrets und keine gültigen Login-Daten.

## Lokale `.env`

Jeder Bearbeiter legt lokal eine eigene `.env` an:

```text
BC_URL=https://businesscentral.dynamics.com/<tenant>/<environment>?company=<company>
BC_LOCALE=de-DE
BC_TIMEZONE=Europe/Berlin
```

Die `.env` wird nicht committet.

## Mehrere Projekte, mehrere Umgebungen

Wenn mehrere Projekte im selben Repository liegen, bekommt jedes Projekt eigene Variablen mit Prefix.

Beispiel:

```text
FIBU_BOOK5_BC_URL=https://businesscentral.dynamics.com/<tenant>/playthru?company=UNIVERSAARL-DE
FIBU_BOOK5_BC_LOCALE=de-DE
FIBU_BOOK5_BC_TIMEZONE=Europe/Berlin

KUNDE_X_BC_URL=https://businesscentral.dynamics.com/<tenant>/<environment>?company=<company>
KUNDE_X_BC_LOCALE=de-DE
KUNDE_X_BC_TIMEZONE=Europe/Berlin
```

Regel:
- `BC_URL` ist nur der einfache Fallback.
- Projekttests sollen bevorzugt `PROJECTPREFIX_BC_URL` verwenden.
- Jeder Projektordner enthält eine kleine `project.ts` oder vergleichbare Konfiguration mit `envPrefix`.
- Das Projektregister in `PROJECTS.md` nennt Slug, Zweck, Env-Prefix und Status.
- Eine Umgebung darf in mehreren Projekten genutzt werden, wenn die Companies und Testdaten sauber getrennt sind.
- Eine Company darf nur dann von mehreren Projekten genutzt werden, wenn das im jeweiligen Projekt-README ausdrücklich dokumentiert ist.

## Trennschärfe zwischen Projekt und Umgebung

Projekt und Umgebung sind nicht dasselbe.

| Begriff | Bedeutung | Beispiel |
|---|---|---|
| Projekt | fachliche oder redaktionelle Automationsstrecke | `fibu-book5` |
| Umgebung | technische Business-Central-Instanz | `playthru` |
| Company | Mandant innerhalb der BC-Umgebung | `UNIVERSAARL-DE` |
| Testdatenstand | versionierte fachliche Datenbasis | `foundation/universaarl-de-foundation.json` |

Ein Projekt kann später auf eine neue Umgebung umziehen, ohne dass Testfallnamen und Buchlogik geändert werden. Dafür werden technische Details in `.env` und Projekt-README gekapselt.

## Umgebungssteckbrief

Für jede genutzte Umgebung wird ein kurzer Steckbrief im jeweiligen Projekt-README oder in einer separaten Projektdokumentation gepflegt.

| Feld | Beispiel | Zweck |
|---|---|---|
| Projekt | `fibu-book5` | Zuordnung zum Buch/Kunden/Use Case |
| Tenant | nur Kurzbeschreibung, keine Secrets | Orientierung |
| Environment | `playthru` | technische BC-Umgebung |
| Company | `UNIVERSAARL-DE` | aktive Zielcompany |
| Sprache | `de-DE`, gemischt, englisch | wichtig für Suchbegriffe und Screenshots |
| Datenquelle | leere/aufgebaute Universaarl-Zielcompany | Ursprung der Trainingsdaten |
| Login-Methode | manueller Entra-ID-Login + `storageState` | Wiederholbarkeit |
| Besonderheiten | z. B. Popups, gemischte Sprache | Workarounds |

## Sprachregel

Die meisten zukünftigen Business-Central-Umgebungen sollen deutsch sein. Trotzdem müssen Tests bilingual bleiben, weil:

- BC-Seiten in deutschen Mandanten teilweise englische Seitennamen behalten.
- Tell-Me-Suche englische Begriffe oft zuverlässiger findet.
- Microsoft-Learn-Begriffe häufig englisch sind.
- Demo-/Trial-Umgebungen gemischtsprachig erscheinen können.

Regel:
- Buchtext deutsch.
- Testcode darf englische Suchbegriffe nutzen.
- Screenshots für finale Buchfassungen möglichst deutsch.

## Authentifizierung

1. `.env` lokal anlegen.
2. `npm install` ausführen.
3. `npx playwright install chromium` ausführen, falls Browser fehlen.
4. `npm run auth:bc` starten.
5. Im sichtbaren Browser anmelden und MFA abschliessen.
6. Warten, bis die Business-Central-Shell sichtbar ist. Sichere Signale sind Role Center, Suche/Tell Me oder My Settings.
7. `npm run auth:bc:check` ausfuehren.
8. Wenn der Check rot bleibt und der Browser auf Microsoft-Sign-in haengt, `npm run auth:bc:diagnose` ausfuehren.

Der gespeicherte Zustand liegt unter:

```text
playwright/.auth/bc-user.json
```

Diese Datei bleibt lokal und wird nicht committet.
Die Diagnose darf keine Cookies, Tokens, Tenant-IDs, Account-Namen oder Login-Screenshots in Evidence schreiben.
