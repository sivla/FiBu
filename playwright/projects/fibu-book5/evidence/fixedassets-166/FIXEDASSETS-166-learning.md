# FIXEDASSETS-166 Lernzusammenfassung

Status: `labor`, `read-only`, `candidate-discovery`, `no-setup-change`, `no-value-entry`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

Chart of Accounts was read-only visible and produced G/L candidate accounts for a later Acquisition Cost Bal. Acc. setup decision: 14160 Advanced Payments for goods and services Balance Sheet Assets Inventory Posting; 11400 Advanced Payments for Intangible Fixed Assets Balance Sheet Assets Assets Posting.

## Was man in Business Central lernt

Ein Gegenkonto fuer Anlagenzugang darf nicht aus einem beliebigen sichtbaren Konto abgeleitet werden. Zuerst muss klar sein, dass man sich in einer G/L-Account-Quelle befindet. Selbst dann ist ein sichtbares Konto nur ein Kandidat, bis ein separater Setup-Fit entscheidet, ob es fachlich zum Feld `Acquisition Cost Bal. Acc.` passt.

## Buchwirkung

Kapitel 21 kann diesen Lauf als Zwischenkontrolle erklaeren: Kontenplan lesen, Kandidaten erkennen, aber noch nichts in die Anlagenbuchungsgruppe schreiben.

## Grenzen

- Kein Setup-Fit.
- Keine Werteingabe.
- Keine Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-167: judge whether a visible G/L account candidate is safe enough for a separate UI-first setup-fit case; no setup change in FA-166.
