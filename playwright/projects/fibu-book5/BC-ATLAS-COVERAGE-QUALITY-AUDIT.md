# BC Atlas Coverage Quality Audit - PREP-022

Status: `prep-done`

Instanz: `playthru`

Zielcompany: `UNIVERSAARL-DE` (`planned-not-yet-created`)

Quelle fuer Prioritaeten: `UNIVERSAARL-USECASE-BACKLOG.md`

## Zweck

Die Atlanten sollen keine Ablage fuer zufaellige alte Beobachtungen sein. Sie sollen spaetere Universaarl-Laeufe schneller und sicherer machen:

- Welche Page oder Liste wird geoeffnet?
- Welche Felder, FastTabs und Actions sind fuer den Usecase wichtig?
- Welche Aktion ist read-only?
- Welche Aktion ist wirksam und braucht ein Gate?
- Welche Dialoge oder Request Pages duerfen nicht blind bestaetigt werden?
- Welche Posten muessen nach Preview oder Posting kontrolliert werden?
- Welche alten RM-DEMO-/CRONUS-Befunde sind nur noch Patternquelle?

## Audit-Ergebnis je Atlas

| Atlas | Qualitaet | Sofort aktiv fuer Universaarl | Problem | Naechste Pflege |
| --- | --- | --- | --- | --- |
| `BC-ACTION-ATLAS.md` | `useful-but-legacy-heavy` | Split-Button/Tooltip-Regeln, Companies `Neu`/Dropdown, Dialog-Gates | viele P2P/FA-Actions sind RM-DEMO-Labor und duerfen nicht als Zielroute wirken | Legacy-Actions nur noch bei konkretem Universaarl-Usecase reaktivieren |
| `BC-CARD-ATLAS.md` | `thin-but-usable` | Companies/Mandanten Listenkontext | nur eine aktive Zeile; Foundation-Karten fehlen noch | nach Company Creation: Company Information, No. Series, Posting Groups, VAT, Dimensions ergaenzen |
| `BC-DIALOG-ATLAS.md` | `usable-for-company-gate` | Warnungen zu `Neu`, unsaved row, Assisted Setup | Datenbasis-/Permission-Dialog noch nicht aus finalem Rechte-Lauf bekannt | TARGET-009 muss Permission/Data-Basis-Dialoge neu erfassen |
| `BC-PAGE-ATLAS.md` | `useful-but-mixed` | Page-Kontextregel, Companies, Look-and-Feel-Zielseiten | Legacy-P2P/FA-Seiten stehen vor Universaarl-Prioritaeten | Universaarl-priority section fuehrt ab jetzt W0-W5 |
| `BC-LIST-ATLAS.md` | `best-current-atlas` | Listenstatuswerte, Companies, geplante Ledger-/Masterdata-Listen | viele Listen sind bewusst `planned`, weil Company fehlt | nach W0/W1 mit echten Universaarl-Listen auffuellen |
| `BC-FIELD-ATLAS.md` | `legacy-heavy` | UI-Sichtbarkeitsregel, geplante Look-and-Feel-Felder | stark P2P/RM-lastig; keine klare Universaarl-Feldprioritaet | Foundation-/Masterdata-Feldprioritaeten vor Legacy-Tabelle setzen |
| `BC-REQUEST-PAGE-ATLAS.md` | `thin-but-risk-aware` | Request-Page-Regel fuer Report/Batch/OK-Risiko | konkrete Universaarl-Reports fehlen | nach Quellenmapping und Datenreichtum um erste Reports ergaenzen |
| `BC-TABLE-ENTRY-ATLAS.md` | `thin-but-correct` | Entry-Erfassungsregel | noch keine Universaarl-Entries, erwartete Entry-Gruppen fehlen | erwartete Entry-Matrix fuer O2C/P2P/Inventory/Payments einfuegen |
| `BC-POSTING-IMPACT-ATLAS.md` | `legacy-reference-only` | Muster fuer erwartete Postenarten | nur RM-DEMO-/CRONUS-Laborwirkungen | als Patternquelle belassen, Universaarl-Spalte erst nach W3 |
| `BC-ERROR-BLOCKER-ATLAS.md` | `useful-pattern-archive` | Company-Creation-Blocker und UI-Regeln | viele alte P2P/FA-Blocker sind nicht aktive Zielqueue | Legacy-Blocker nur bei Wiederholung in Universaarl reaktivieren |

## Aktive Atlas-Prioritaeten

| Reihenfolge | Usecase | Atlas-Fokus | Ergebnis |
| ---: | --- | --- | --- |
| 1 | `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` | Action, Dialog, List, Page | Split-Button, Tooltip, Menueintrag, Permission-/Datenbasis-Dialog und sichtbarer Zielzustand |
| 2 | `TARGET-COMPANY-INFO-001` | Card, Field, Page | Company Information Page, Rechts-/Adressfelder, Buchscreen-Kontext |
| 3 | `TARGET-FOUNDATION-001` | Page, Dialog, Request Page | Assisted/Manual Setup, Abbruch-/Finish-Regeln |
| 4 | `TARGET-NOSERIES-001` | List, Card, Field | Nummernserien, Nummernserienzeilen, Beziehung zu Belegarten |
| 5 | `TARGET-POSTINGGROUPS-001` | List, Card, Field, Table Entry | Posting Groups, Matrixfelder, erwartete G/L-Wirkung |
| 6 | `TARGET-VAT-001` | List, Field, Table Entry | VAT Business/Product Groups, VAT Posting Setup, spaetere VAT Entries |
| 7 | `TARGET-DIMENSIONS-001` | List, Card, Field | Dimension Values, Default Dimensions, spaetere Dimension Set Entries |

## Legacy-Regel

Ein Legacy-Eintrag bleibt wertvoll, wenn er eines liefert:

- wiederverwendbares UI-Muster,
- bekannter Blocker,
- Screenshot-QA-Warnung,
- Postenspur-Muster,
- Dialog-/Request-Page-Warnung.

Ein Legacy-Eintrag darf nicht:

- als Universaarl-Zielbeweis gelten,
- eine geplante Universaarl-Route ersetzen,
- Company-, Setup-, Preview- oder Posting-Gates ueberspringen,
- als finaler deutscher Buchclaim verwendet werden.

## Definition von "brauchbarer Atlas-Eintrag"

Ein Atlas-Eintrag ist aktiv brauchbar, wenn mindestens vier Punkte klar sind:

1. Page/List/Card/Worksheet oder Dialog-Kontext.
2. Usecase- oder Kapitelbezug.
3. sichere und riskante Actions getrennt.
4. Evidence oder geplanter Universaarl-Follow-up.
5. Grenze: was der Eintrag nicht beweist.

Ein Eintrag ohne diese Punkte wird in einem spaeteren PREP-/Atlas-Lauf auf `legacy-reference`, `planned`, `blocked` oder `remove-from-active-atlas` gesetzt.

## Naechster sinnvoller Schritt

`PREP-023-BOOK-CHAPTER-STIMMIGKEIT-AUDIT`

Nach der Atlasqualitaet soll der Buchfluss geprueft werden: Kapitel duerfen nicht in RM-DEMO/Rhein-Main zurueckfallen und muessen mit dem Universaarl-Usecase-Backlog zusammenpassen.
