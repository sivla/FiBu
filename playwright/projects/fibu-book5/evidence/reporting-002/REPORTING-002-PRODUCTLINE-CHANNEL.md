# REPORTING-002 PRODUCTLINE/CHANNEL nach O2C-Laborrechnung

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, read-only, no-posting |
| Gebuchte Verkaufsrechnung | PS-INV103297 |
| Verkaufsauftrag | S-ORD101068 |
| Kontroll-Artikelposten | Entry No. 792 |

## Kernergebnis

| Frage | Befund |
|---|---|
| PRODUCTLINE=MACHINE in Sachposten sichtbar | nein |
| CHANNEL=B2B in Sachposten sichtbar | nein |
| PRODUCTLINE=MACHINE am Artikelposten sichtbar | ja |
| CHANNEL=B2B am Artikelposten sichtbar | ja |
| Financial Reports erreichbar | ja |
| PRODUCTLINE/CHANNEL in Financial Reports sichtbar nutzbar | nein |
| Dimension-/Analyseoptionen in Financial Reports sichtbar | ja |

## Was sichtbar oder API-seitig nachgewiesen wurde

- Die Pruefung lief read-only in `MCP_1_20260210`, Company `RM-DEMO`.
- `PS-INV103297` wurde in den relevanten Postenseiten gefiltert; es wurde nichts gebucht.
- Der bekannte Artikelposten `792` dient als Kontrollpunkt fuer die bereits belegten O2C-Dimensionen.
- Financial Reports wurden als Reporting-Einstieg geprueft; Zahlenwirkung wird nur behauptet, wenn die Dimension dort sichtbar nutzbar ist.

## Grenzen

- CRONUS-USA-Labor, kein deutscher Finalnachweis.
- Deutsche `19 %` USt ist weiterhin offen.
- Kein neuer O2C-Beleg und keine neue Buchung in diesem Lauf.
- Falls PRODUCTLINE/CHANNEL nicht im Financial Report sichtbar sind, ist der Buchanspruch weiterhin Zielbild und nicht Reporting-Endnachweis.

## Buchwirkung

Das Buch muss zwischen Dimension im Beleg/Posten und Dimension als Berichtsauswertung unterscheiden. Ein Anfaenger soll lernen: Eine Dimension kann korrekt am gebuchten Posten vorhanden sein, ohne dass ein Financial Report sie automatisch als sichtbare Achse oder Filter zeigt. Fuer die finale Anleitung braucht es deshalb einen separaten Reporting-Nachweis oder eine dokumentierte Einrichtung ueber Berichtsdimensionen, Analysis Views oder Dimensionsberichte.

## Naechster Schritt

Falls Dimensionen in G/L Entries nicht sichtbar sind, gezielt Dimension Set/Dimensions auf Sachposten oder Dimensionen - Detail pruefen; falls Financial Reports keine Achse zeigen, Analysis Views oder Berichtsdimensionen einrichten/pruefen.
