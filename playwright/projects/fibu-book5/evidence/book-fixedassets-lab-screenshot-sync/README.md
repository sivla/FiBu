# BOOK-FIXEDASSETS-LAB-SCREENSHOT-SYNC

Status: `book-sync`, `labor-screenshots`, `no-bc-run`, `no-posting`, `de-final-open`

Dieser Lauf nutzt vorhandene Fixed-Assets-Evidence fuer Kapitel 21 staerker im Buch. Es wurden keine BC-Daten geaendert, keine Stammdaten gepflegt, kein Setup veraendert, keine Einkaufsrechnung gebucht und keine neuen Screenshots erzeugt.

| Screenshot | Buchnutzung | Beweist | Beweist nicht |
|---|---|---|---|
| `playwright/projects/fibu-book5/img/fixedassets-014-020-depreciation-books-after-hgb.png` | Laborbild Setup-Voraussetzung | `HGB` ist in `RM-DEMO` als AfA-Buch sichtbar | kein deutscher HGB-Endstand, keine Anlage, keine AfA |
| `playwright/projects/fibu-book5/img/fixedassets-016-020-fa-posting-groups-after-machines.png` | Laborbild Kontenfindung | `MACHINES` ist mit CRONUS-Konten sichtbar | kein deutscher Kontenplan, keine Buchung |
| `playwright/projects/fibu-book5/img/fixedassets-033-060-card-final-values.png` | Laborbild Stammdatenfit | `FA-CNC-01` zeigt zentrale Kartenwerte und `Book Value = 0,00` | kein Anlagenzugang, keine Anlagenposten, keine AfA |
| `playwright/projects/fibu-book5/img/fixedassets-043-020-k30000-vendor-invoicing-fasttab-proof.png` | Labor-/Diagnosebild Kreditor | `K30000`-Invoicing-Teilfelder sind sichtbar | keine vollstaendige Purchase-Invoice-Readiness |
| `playwright/projects/fibu-book5/img/fixedassets-053-030-purchase-invoice-after-new.png` | Labor-Preflight | leere `Purchase Invoice` mit Pflichtfeldern und Zeilenbereich ist sichtbar | kein `K30000`, kein `FA-CNC-01`, keine Preview, keine Buchung |
| `playwright/projects/fibu-book5/img/fixedassets-064-050-line-type-fixed-asset-visible.png` | Rejected-Path-Lernbild | blindes Tippen setzt `Type = Fixed Asset` nicht belastbar; Dialogtext ist kein Feldnachweis | kein Zielzustand, kein Anlagenzeilentyp, keine Anlagenbuchung |

## Buchwirkung

Kapitel 21 erklaert jetzt pro Bild:

- was sichtbar ist,
- warum der Screenshot fachlich wichtig ist,
- was Anfaenger daraus lernen,
- ob es Labor oder final ist,
- welche Evidence dahintersteht,
- was weiter offen bleibt.

## Naechster Schritt

Der praktische Prozess bleibt vor der Anlagen-Einkaufsrechnung gesperrt. Naechster sinnvoller Lauf: `FIXEDASSETS-065-PURCHASE-INVOICE-LINE-TYPE-HELPER-DIAGNOSIS`, also die echte Dropdown-/Lookup-Auswahl fuer den Einkaufsrechnungs-Zeilentyp diagnostizieren, weiterhin ohne `FA-CNC-01`, Preview oder Buchung.
