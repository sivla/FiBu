# P2P-034 - Purchase Journal Bookmaster Integration

Status: `labor-sufficient-for-book-draft`, `needs-german-final-rebuild`

Dieser Lauf hat keine neue Business-Central- oder Playwright-Ausfuehrung erzeugt. Er integriert die bereits belegte Purchase-Journal-Laborroute `P2P032-682298` aus `P2P-032`/`P2P-033` in Kapitel 12 des Buchmasters.

## Bewiesen

- Kapitel 12 enthaelt jetzt einen klar markierten Laborabschnitt zur direkten Purchase-Journal-Route.
- Die Route wird von der Einkaufsbestellung mit Wareneingang getrennt.
- Die sichtbare Labor-Postenspur wird benannt: Kreditorenposten, detaillierter Kreditorenposten und Sachposten.
- Die Grenze wird benannt: keine Artikelposten, keine Wertposten, kein Wareneingang aus dieser Journalroute.

## Nicht bewiesen

- Keine deutsche `19 %` Vorsteuer.
- Kein deutscher Kontenplan-Endstand.
- Keine deutsche finale Journalroute.
- Keine Loesung des offenen Teil-Wareneingangs-Blockers.

## German-Final-Rebuild

Die deutsche Zielcompany muss diese Route spaeter neu erzeugen, falls sie im finalen Buch bleiben soll: mit deutschen Konten, Buchungsgruppen, Steuerlogik, Belegnummern, Screenshots und Postenspur.
