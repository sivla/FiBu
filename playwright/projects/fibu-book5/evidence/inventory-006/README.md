# INVENTORY-006 Evidence Index

Status: CRONUS-USA-Labor, kontrollierter Item-Journal-Draft, keine Buchung.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-target-journal-line-controls.json` | Grid-Control-Evidence | Page `40`/`Item Journals` nimmt `Positive Adjmt.`, `INV006-*`, `RM-M100`, `FRA-ZL`, Menge `2`, `PCS`, Unit Amount/Amount/Unit Cost `42.000,00`/`84.000,00` an | keine Posten, keine Buchung, keine sichtbare Preview | Labor-Nachweis |
| `010-target-journal-line-page-text.txt` | UI-Rohtext | Seite, Batch `DEFAULT`, Feldueberschriften und Aktionsleiste sind im Journal-Kontext vorhanden | Grid-Eingabewerte sind im BC-Text nicht verlaesslich enthalten | Labor-Nachweis mit Limitation |
| `inventory-006-010-target-journal-line-before-post.screenshot.json` | Screenshot-Metadaten | Screenshotzweck, Status `labor`, bekannte Grenzen und Buchnutzung `field-proof` | keine visuelle Aussage ueber rechts liegende Unit-Cost-Spalte | Labor-Metadaten |
| `020-line-dimensions-attempt-page-text.txt` | UI-Rohtext | `Line` -> `Dimensions` oeffnet `Edit Dimension Set Entries`; `PRODUCTLINE` / `Machine` ist am Journal-Draft sichtbar | kein gebuchter Dimensionsposten | Labor-Nachweis |
| `030-posting-controls-buttons.json` | Button-Evidence | `Post` ist sichtbar; Preview Posting wurde im stabilen Preflight nicht als sichtbare Aktion nachgewiesen | keine negative Vollstaendigkeitsgarantie fuer alle Menueebenen | Labor-Kontrolle |
| `030-posting-controls-page-text.txt` | UI-Rohtext | Journal-Kontext nach Dimensionskontrolle; keine Preview-Wirkung | keine Buchungsvorschau und keine Posten | Labor-Kontrolle |
| `INVENTORY-006-TARGET-STOCK-DRAFT-result.json` | Ergebnis-JSON | Zielwerte sichtbar, Unit Cost sichtbar, `PRODUCTLINE=MACHINE` sichtbar, `posted=false`, Cleanup `cleaned=true` | kein positiver Bestand, keine Artikel-/Wert-/Sachposten, keine Lagerbewertungskorrektur | Labor-Nachweis |
| `INVENTORY-006-TARGET-STOCK-DRAFT.md` | Lernzusammenfassung | Warum Item Journal der richtige Einstieg ist und warum ohne Preview-/Kontrollwirkung nicht gebucht wurde | kein finaler deutscher Prozess | Buch-/Lern-Evidence |

## Zentrale Wahrheit

`INVENTORY-006` beweist den kontrollierten Draft, nicht die Bestandsbuchung. Der praktische Lauf hat gezeigt:

- Zielzeile `RM-M100 +2` in `FRA-ZL` kann vorbereitet werden.
- BC zieht `PCS`, Unit Amount `42.000,00`, Amount `84.000,00` und Unit Cost `42.000,00`.
- `PRODUCTLINE=MACHINE` ist vor der Buchung im Dimensionsdialog sichtbar.
- `Post` ist sichtbar, aber `Preview Posting` wurde im stabilen Preflight nicht als nutzbarer Kontrollpfad nachgewiesen.
- Der Draft wurde ueber das Zeilenmenue `Weitere Optionen anzeigen` -> `Zeile loeschen` bereinigt.

## Laborgrenze

Keine Buchung, kein positiver Bestand, keine korrigierte `Inventory Valuation`, kein deutscher Kontenplan-Endstand und kein deutscher Finalnachweis. Der naechste praktische Schritt muss zuerst einen stabilen nicht buchenden Kontrollpfad klaeren oder bewusst entscheiden, ob `Journal Check` fuer diesen Journaltyp als Vorabkontrolle reicht.
