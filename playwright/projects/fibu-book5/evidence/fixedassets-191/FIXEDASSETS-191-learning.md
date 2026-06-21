# FIXEDASSETS-191 Lernzusammenfassung

Status: `labor`, `local-review`, `no-bc-run`, `no-playwright-run`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

FA-191 bewertet die FA-190-Aktionsinventur. Der direkte Frame-Kandidat `Preview Posting` ist auf `Fixed Asset G/L Journals` nicht sichtbar. Sichtbar sind nur Post-nahe Aktionskandidaten wie `Post`, `Verwandte Aktionen fuer Post`, `Insert FA Bal. Account`, `Reconcile` und ein deaktiviertes `Apply Entries...`.

Die Review-Entscheidung ist:

- `Post` bleibt gesperrt.
- `Preview Posting` bleibt gesperrt, solange kein eigener Menuekandidat nachgewiesen ist.
- `Insert FA Bal. Account` ist nicht read-only, weil es Ausgleichszeilen einfuegen kann.
- `Reconcile` kann spaeter ein sinnvoller Preflight-Kandidat sein, braucht aber einen eigenen Case.
- Ein einziger naechster Live-Schritt ist vertretbar: den Split-/Dropdown-Button `Verwandte Aktionen fuer Post` oeffnen und nur das Menue inventarisieren.

## Warum kein normaler Post-Klick?

FA-188 hat gezeigt, dass der grobe `Post`-Pfad den normalen Buchungsdialog oeffnen kann. FA-190 hat zudem keinen direkten `Preview Posting`-Kandidaten gefunden. Ein erneuter Klick auf den Hauptteil von `Post` waere daher kein Lernfortschritt, sondern eine Wiederholung eines bekannten Risikos.

## Naechster sicherer Schritt

`FIXEDASSETS-192-FA-GL-JOURNAL-POST-DROPDOWN-MENU-INVENTORY` darf nur:

- Business Central in `MCP_1_20260210 / RM-DEMO` oeffnen,
- die Fixed Asset G/L Journals Page oeffnen,
- den eindeutig gefundenen Split-/Dropdown-Button `Verwandte Aktionen fuer Post` anklicken,
- Menuepunkte lesen,
- sofort abbrechen, wenn ein Dialog, Posting-Dialog oder Seiten-/Datenveraenderung sichtbar wird.

Nicht erlaubt: Menuepunkt klicken, `Post`, `Preview Posting`, `OK`, `Yes/Ja`, Journalzeilen anlegen/aendern/loeschen, Setup aendern, Buchung, Buchaenderung.
