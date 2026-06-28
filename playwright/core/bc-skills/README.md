# Business Central Playwright Skill Roadmap

Status: `draft`, keine neue Library.

Diese Map beschreibt wiederverwendbare Playwright-Faehigkeiten, die aus echter Evidence entstehen sollen. Sie ist keine Aufforderung, Skills auf Vorrat zu bauen.

| Skill | Zweck | Erst bauen/verbessern wenn | Output |
|---|---|---|---|
| Business Central Context Confirm | Instanz, Company, Page-Kontext sichern | jeder Live-Case | Kontext-JSON + Screenshot-Zweck |
| Frame Reader | Fachlichen BC-Frame statt Shell lesen | Direct Page/Page-ID oder Shell-only Text | Frame-Auszug + Page-Signale |
| FastTab Expander | relevante FastTabs sichtbar machen | Felder fehlen, aber Page richtig | geoeffnete Tabs + Feldliste |
| Card Field Reader | Kartenfelder zeilen-/captionnah lesen | Kartenwerte fuer Buch/Setup zaehlen | Feld/Wert/Control-Diagnose |
| Grid/Subform Reader | Zeilen/Subform robust lesen | P2P/O2C/Journal Lines | Spalten-/Zeilen-Snapshot |
| Grid Column Discovery | sichtbare Spalten und x/y-Kandidaten mappen | Qty/No/Type-Felder fragil | Spaltenatlas |
| Lookup Reader/Selector | Lookup-Kandidaten lesen/waehlen | Dropdown/Lookup blockiert | no-select oder select Evidence |
| Action/Button Discovery | Actions fokussiert erfassen | Button-/Menuepfad unklar | Action-Liste mit Kontext |
| [BC Action Discovery](action-discovery.md) | Actions nur im fachlichen Page-/Subform-Kontext erfassen | Shell-/Role-Center-/Account-Aktionen verfaelschen Prozessroute | gescoptes Action-Inventar + Blocker/Route |
| Dialog Reader/Confirm Guard | Dialogtext vor OK/Yes/Post sichern | riskante Bestätigung | Dialog-Evidence |
| Preview Posting Capture | Preview-Arten/Posten vor Buchung sichern | Buchungsgate | Preview JSON + Screenshot |
| Post and Trace | Posting + Folgeposten suchen | aktiver Case unlockt Posting | Belegnummern + Ledger Trace |
| Screenshot with Metadata | Bildzweck und Grenze erzwingen | jeder Screenshot | PNG + `.screenshot.json` |
| Evidence Pack Writer | Result/README/learning konsistent schreiben | jeder Prozesslauf | Evidence-Index |
