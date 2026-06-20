# FIXEDASSETS-161 Lernzusammenfassung

Status: `labor`, `guarded-preflight`, `blocked-before-value-entry`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

FA-161 stopped before value entry: Protected target line G05001 / FA-CNC-01 / HGB was not visible. | Bal. Account No. K30000 looks like a vendor code, but target Bal. Account Type is G/L Account.

## Was man in Business Central lernt

`Bal. Account Type` und `Bal. Account No.` muessen fachlich zusammenpassen. Ein Code wie `K30000` ist im Projektkontext ein Kreditor-/Vendor-Code. Wenn die Zeile gleichzeitig `Bal. Account Type = G/L Account` erwartet, waere eine Eingabe riskant oder falsch.

## Buchwirkung

Kapitel 21 sollte diesen Fehlerfall erwaehnen: Vor Betrag/Gegenkonto-Eingabe wird nicht nur die Spalte sichtbar gemacht, sondern auch die Logik des Gegenkonto-Typs geprueft.

## Naechster Schritt

FIXEDASSETS-162: decide locally whether Bal. Account Type must be Vendor for K30000 or whether a different G/L Account target is required before any value entry retry.
