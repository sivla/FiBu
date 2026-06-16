# Evidence Pack Standard for Click Guides

Stand: 16.06.2026

Zweck: Dieses Dokument definiert, wann eine bebilderte Business-Central-Klickanleitung im Projekt als buchfaehig gelten kann.

## Vier Nachweise

Eine grosse Klickanleitung ist erst final buchfaehig, wenn vier Ebenen zusammenpassen.

| Ebene | Frage | Typische Evidence |
|---|---|---|
| UI-Nachweis | Wurde die richtige BC-Seite geoeffnet und ist der Screenshot reproduzierbar? | Screenshot, Screenshot-Metadaten, Such-/Navigationspfad, Company/Sprache/Viewport |
| Technischer Nachweis | Welche Page, Tabelle, Felder, Filter und Extensions stecken dahinter? | Page Inspection, Page Name, Page ID, Page Type, Source Table, wichtige Felder, Filter, Extension-Hinweis |
| Fachlicher Nachweis | Ist der erwartete Prozesszustand erreicht? | Belegstatus, Pflichtfelder, Kopf-/Zeilenwerte, Preview Posting, Journal Check, Dialogauswahl |
| Posten-/Persistenznachweis | Bleibt die Wirkung nach erneutem Oeffnen oder in Posten/Berichten belegbar? | Posted Document, Ledger Entries, Value/Item Entries, VAT Entries, Bank/FA/Job/Service Entries, Report oder erneuter Listen-/Kartenaufruf |

## Technischer Nachweis je Anleitung

Fuer groessere Prozessanleitungen soll die Evidence mindestens diese Tabelle enthalten:

| Merkmal | Wert |
|---|---|
| Umgebung |  |
| Company |  |
| Sprache / Region |  |
| Rolle / Profil |  |
| Page |  |
| Page ID |  |
| Page Type |  |
| Source Table |  |
| Wichtige Felder |  |
| Wichtige Filter |  |
| Extensions beteiligt |  |
| Screenshot-ID |  |
| Evidence Pack |  |
| Labor-/Finalstatus |  |

## Page -> Table -> Fields -> Posting Result -> Evidence

Fuer zentrale Prozesse soll eine kompakte Mapping-Zeile gepflegt werden:

| Prozess | Page | Tabellen | Nachweis |
|---|---|---|---|
| Sales Order | Sales Order | Sales Header + Sales Line | Posted Sales Invoice, Customer Ledger Entry, G/L Entry, Item Ledger Entry, Value Entry |
| Purchase Order | Purchase Order | Purchase Header + Purchase Line | Posted Purchase Invoice, Vendor Ledger Entry, G/L Entry, Item Ledger Entry, Value Entry |
| Item Journal | Item Journal | Item Journal Line | Item Ledger Entry, Value Entry, G/L Entry |
| General Journal | General Journal | Gen. Journal Line | G/L Entry, ggf. Customer/Vendor/Bank Ledger Entry |

## Grenzen

- CRONUS-USA-Labor ist kein deutscher Finalnachweis.
- Page Inspection ist technischer Kontext, kein finales Buchbild.
- Personalisieren beweist Sichtbarkeit, nicht fachliche Logik.
- Ein gruener Playwright-Test ist kein Buchnachweis, wenn Screenshot, technische Page-Info, fachlicher Zustand oder Postenspur fehlen.
- Ein Screenshot ist kein Buchbild, wenn das gewollte sichtbare Lernziel nicht erkennbar ist.
