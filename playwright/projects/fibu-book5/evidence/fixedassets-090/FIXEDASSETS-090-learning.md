# FIXEDASSETS-090 Lernzusammenfassung

Status: `labor`, `read-only`, `action-inventory`, `no-draft`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

FA-090 captured read-only journal action inventory. Post is visible and remains locked. A safe Delete cleanup route was not proven; group probing can return Role Center context, so cleanup remains unproven rather than disproven.

## Was man in Business Central lernt

Aktionsleisten in Business Central sind nicht gleichbedeutend mit ausgefuehrten Aktionen. Fuer Journale muss man zwischen sichtbaren Kandidaten, geoeffneten Menuegruppen und tatsaechlich ausgefuehrten Aktionen unterscheiden. FA-090 inventarisiert nur, ob ein Cleanup-Pfad sichtbar ist.

Ein weiterer Lernpunkt ist die Kontextkontrolle nach Menueaktionen: Wenn ein Scan wieder Role-Center-Texte sieht, darf der Evidence-Befund nicht als vollstaendige Action Map verkauft werden. Fuer das Buch zaehlt dann die konservative Aussage: Der sichere Lauf hat keinen Cleanup-Pfad nachgewiesen.

## Buchwirkung

Kapitel 21 sollte vor Journal-Drafts erklaeren, dass eine Zeile erst angelegt werden darf, wenn Loeschen oder bewusstes Behalten dokumentiert ist. Sichtbare Aktionen wie `Post`, `Reconcile` oder `Insert FA Bal. Account` bleiben gesperrt.

## Naechster Schritt

Decide whether cleanup must use a keep-draft policy, a safer cleanup discovery route or another route before any journal value entry.
