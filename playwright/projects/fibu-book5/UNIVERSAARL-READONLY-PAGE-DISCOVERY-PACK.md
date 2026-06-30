# Universaarl Read-only Page Discovery Pack - PREP-024

Status: `prep-done`

Instanz: `playthru`

Zielcompany: `UNIVERSAARL-DE` (`planned-not-yet-created`)

Modus: Read-only-Vorbereitung bis SUPER-/Company-Create-Rechte vorhanden sind

## Leitplanke

Dieser Pack bereitet sichere Page-Discovery-Laeufe vor. Er erstellt keine Company, speichert keine Datensaetze, bestaetigt keinen Wizard, aendert kein Setup und fuehrt keinen Report, Preview oder Posting aus.

Read-only heisst hier:

- Seite oeffnen,
- Kontext lesen,
- Spalten, FastTabs, FactBoxes und Actions inventarisieren,
- Tooltips/Accessible Names erfassen,
- Page Inspection nutzen, wenn verfuegbar,
- Screenshot nur mit klarem Zweck erzeugen,
- bei wirksamen Buttons stoppen.

## Warum dieser Pack jetzt kommt

PREP-023 zeigt: Kapitel 3 ist der Universaarl-Anker, Kapitel 6 bleibt der groesste Bruch. Bevor `UNIVERSAARL-DE` angelegt werden kann, muessen die ersten Seiten und ihre sichtbaren Bedienmuster vorbereitet sein. So klickt der naechste Live-Lauf nicht ins Ungefaehr, sondern folgt einer kleinen, geprueften Landkarte.

## Discovery-Karten

| Reihenfolge | Discovery-ID | Seite/Kontext | Zweck fuer das Buch | Erlaubt | Stoppen bei | Atlas-Ziel |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | `RO-W0-COMPANIES-357` | Mandanten / Companies Page `357` | Company-Liste, `Neu`, Pfeil neben `Neu`, `Neues Unternehmen erstellen`, `Kopieren`, `Testunternehmen` sauber unterscheiden | PREP-031 erledigt: Liste gelesen, Tooltips/Accessible Names erfasst, Dropdown geoeffnet, `UNIVERSAARL-DE` nicht sichtbar | Werteingabe, Speichern, `Fertig stellen`, `OK`, `Kopieren`, `Testunternehmen`, direkte neue Zeile speichern | Page, List, Action, Dialog |
| 2 | `RO-W0-MY-SETTINGS` | Meine Einstellungen / My Settings | Company-Kontext, Rolle, Region/Sprache und sichere Company-Auswahl erklaeren | Seite oeffnen, aktiven Company-/Role-/Language-Kontext lesen | Company wechseln, Auswahl speichern, Personalisierung speichern | Page, Card, Field |
| 3 | `RO-W0-ROLE-CENTER` | Role Center / Startseite | Shell, Suche, Navigationsleiste, Aktionsleiste und sichtbare Arbeitsbereiche erklaeren | Shell lesen, Suche nur bis Trefferliste, keine Treffer mit Datenwirkung ausfuehren | wirksame Aktionen, Setup-Assistent starten, neue Belege | Page, Action |
| 4 | `RO-W1-COMPANY-INFORMATION` | Company Information | Firmenstammdaten erklaeren: Name, Adresse, Land/Region, USt-IdNr.; spaeter erster Universaarl-Firmennachweis | Seite nur nach vorhandener Company oeffnen; Feldnamen/FastTabs lesen | Editieren, Speichern, Bild/Logo hochladen, Felder befuellen | Card, Field |
| 5 | `RO-W1-ASSISTED-SETUP` | Assisted Setup / Unterstuetztes Setup | Setup-Assistenten als Einstiegsseiten und Risiko erklaeren | Liste lesen, Zeilen/Status erfassen, Tooltips | Wizard starten, `Weiter`, `Finish`, `OK`, Setup aendern | Page, List, Dialog, Request Page |
| 6 | `RO-W1-NO-SERIES` | Nummernserien / No. Series | Belegnummern als Grundlage fuer Buchbelege und Postenspur erklaeren | Liste lesen, vorhandene Spalten und Actions inventarisieren | Neue Serie, Edit List, Lines editieren, Nummern erzeugen | List, Card, Field |
| 7 | `RO-W1-POSTING-GROUPS` | Buchungsgruppen und Buchungsmatrizen | Kontenfindung sichtbar machen: Gruppen, Matrixfelder, erwartete spaetere Sachposten | Listen/Karten lesen, Spalten erfassen | Neue Gruppe, Edit, Setup-Zeile aendern | List, Card, Field, Table Entry |
| 8 | `RO-W1-VAT-SETUP` | VAT Posting Setup / MwSt.-Buchungsmatrix | Deutsche USt-Logik vorbereiten, ohne sie zu behaupten | Matrix lesen, VAT-Bus./Prod.-Gruppen und Prozent-/Kontofelder erfassen | neue Zeile, Konto aendern, Report/Submit/Calculate | List, Field, Table Entry |
| 9 | `RO-W1-DIMENSIONS` | Dimensionen, Dimensionswerte, Standarddimensionen | Reporting- und Filterbasis fuer spaetere Belege vorbereiten | Listen lesen, Werte/Felder/Actions inventarisieren | neue Dimension, Edit, Default Dimension speichern | List, Card, Field |

## Screenshot-QA je Discovery

Ein Screenshot ist nur brauchbar, wenn er mindestens diese Fragen beantwortet:

1. Welche Page oder Liste ist sichtbar?
2. Ist `playthru` oder der erwartete Kontext erkennbar?
3. Welche Company oder welcher geplante Company-Kontext gilt?
4. Welcher Button, welches Feld oder welche Spalte ist der fachliche Fokus?
5. Was darf daraus nicht behauptet werden?

Fuer Split-Buttons wie `Neu` braucht der Screenshot den richtigen Zustand:

- Hauptbutton allein: nur Hauptaktion sichtbar.
- Pfeil neben dem Button: Dropdown sichtbar.
- Menueintrag: Eintrag selbst lesbar.
- Nach Klick: Zielzustand passt zur gewaehlten Aktion.

## Stoppliste fuer PREP-024-Discovery

Sofort stoppen und als `blocked-readonly-boundary` dokumentieren bei:

- `OK`, `Ja`, `Yes`, `Finish`, `Fertig stellen`, `Create`, `Save`, `Speichern`,
- `New/Neu`, wenn dadurch eine neue Zeile oder ein neuer Datensatz entsteht,
- `Kopieren`, `Testunternehmen`, `Copy Company`, `Sample Data`,
- `Edit`, `Edit List`, `Delete`,
- `Preview Posting`, `Post`, `Buchen`, `Invoice`, `Ship`,
- Report-Start, wenn noch nicht geklaert ist, ob er nur anzeigt oder Daten erzeugt.

## Erwartete Result-Struktur

Jeder spaetere read-only Discovery-Test schreibt ein kompaktes Result:

```json
{
  "caseId": "PREP-024-...",
  "source": "playwright-readonly-discovery",
  "resultStatus": "observed|blocked",
  "page": "",
  "pageId": "",
  "instance": "playthru",
  "companyContext": "UNIVERSAARL-DE-planned-not-yet-created|active-company-visible|not-visible",
  "visibleSignals": [],
  "safeActionsObserved": [],
  "riskyActionsObserved": [],
  "fieldsOrColumnsObserved": [],
  "screenshots": [],
  "notProved": [],
  "flags": {
    "noWrite": true,
    "noPost": true,
    "noPreview": true,
    "noSetupChange": true,
    "noCompanyCreated": true,
    "noCompanySwitch": true,
    "noApiShortcut": true
  }
}
```

## Naechster sinnvoller Lauf

`PREP-032-CH04-ERP-BASICS-UNIVERSAARL-REWRITE`

PREP-031 hat `RO-W0-COMPANIES-357` als read-only Playwright-Lauf ausgefuehrt. Das naechste sinnvolle Paket ist ein kleiner Buch-/Clickguide-Schritt: Kapitel 4 darf den sichtbaren Unterschied zwischen Hauptbutton `Neu`, Pfeil neben `Neu` und Menueintrag `Neues Unternehmen erstellen` erklaeren, ohne eine Company-Anlage zu behaupten.
