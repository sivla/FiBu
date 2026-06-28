# P2P-023 - Purchase Invoice Draft 107229 Keep Decision

Status: `labor-sufficient-for-book-draft`, `helper-only`, `no-bc-run`, `no-playwright-run`

## Entscheidung

Purchase Invoice Draft `107229` bleibt bewusst als RM-DEMO-Labortrace erhalten. Der Draft darf nicht als aktive Prozessbasis fuer weitere P2P-Item-Line-, Preview- oder Posting-Schritte wiederverwendet werden.

## Warum

P2P-021 hat die Purchase-Invoice-Route teilweise belegt: direkte Page, scoped `Neu`, sichtbarer Purchase-Invoice-Kontext und `K10000` als Vendor-Kontext. Die anschliessende Bereinigung wurde aber nicht bewiesen.

P2P-022 hat die gefilterte Liste fuer `107229` erneut geprueft. Der Draft war vor und nach dem geschuetzten Delete-Versuch sichtbar. Eine eindeutige sichere Zielbeleg-Loeschbestaetigung wurde nicht erreicht.

Damit waere ein weiterer Listen-Loeschversuch nur Wiederholung. Cleanup darf erst wieder versucht werden, wenn eine wirklich neue Route existiert, zum Beispiel eine eindeutig geoeffnete Belegkarte mit Zielnummer `107229` und einem unmissverstaendlichen Delete-Dialog nur fuer diesen Beleg.

## Buchwirkung

Fuer das Buch ist das ein Labor-Lernfall:

- Ein sichtbarer Entwurfsbeleg ist noch kein sauberer Prozessbeleg.
- Cleanup ist nur dann bewiesen, wenn der Zielbeleg danach nicht mehr sichtbar ist oder der Beleg bewusst als Labortrace behalten wird.
- Ein Draft mit ungeklaertem Cleanup-Status darf nicht still als Basis fuer Preview Posting oder Posting weiterverwendet werden.

## Grenzen

- Keine BC-Ausfuehrung in P2P-023.
- Kein Playwright-Lauf in P2P-023.
- Keine Buchung, kein Preview Posting, kein Setup Change.
- `107229` ist RM-DEMO-Labor, kein deutscher Finalnachweis.

## Naechster Schritt

P2P-024 soll einen frischen kontrollierten Purchase-Invoice-Draft nutzen oder eine neue echte Card-Delete-Route pruefen. Fuer einen frischen Draft muss vorher klar sein: Cleanup wird entweder eindeutig bewiesen oder der neue Draft wird ebenfalls bewusst als Labortrace klassifiziert.
