# FIXEDASSETS-041 - K30000 Vendor Defaults Field Diagnosis read-only

Status: `labor`, `read-only`, `field-diagnosis`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielkreditor | K30000 / Zollspedition Nord GmbH |
| Status | vendor-defaults-diagnosis-partial |
| Gebucht | nein |

## Ergebnis

Die K30000-Kreditorenkarte wurde read-only in breiter Layoutansicht diagnostiziert. Die kritischen Posting-/Currency-/Tax-Defaults sind weiterhin nicht vollstaendig als sichtbare aktive Kartenfelder belegt; vor einem Kaufbeleg bleibt ein enger Sichtbarkeits- oder Setup-Diagnosepunkt offen.

## Feld-Diagnose

| Feld | Sichtbarkeit | Wert / Diagnose |
|---|---|---|
| Vendor Posting Group | nicht sichtbar diagnostiziert | caption-not-visible-in-captured-view |
| Gen. Bus. Posting Group | nicht sichtbar diagnostiziert | caption-not-visible-in-captured-view |
| Currency Code | nicht sichtbar diagnostiziert | caption-not-visible-in-captured-view |
| Tax Area Code | nicht sichtbar diagnostiziert | caption-not-visible-in-captured-view |
| Tax Liable | nicht sichtbar diagnostiziert | caption-not-visible-in-captured-view |
| VAT Bus. Posting Group | nicht sichtbar diagnostiziert | caption-not-visible-in-captured-view |
| Payment Terms Code | sichtbar/diagnostiziert | `1M(8D)` |
| Payment Method Code | sichtbar/diagnostiziert | `BANK` |
| Blocked | sichtbar/diagnostiziert | active-card-label-with-button |

## Bewertung

Keine Einkaufsrechnung und kein Anlagenzugang. Naechster Schritt ist eine gezielte Entscheidung, ob Personalisieren/Page Inspection manuell gefuehrt wird oder ob ein enger Setup-/Field-Fit benoetigt wird.

## Visual-QA

Die Screenshots zeigen K30000 und die Payment-Werte, aber nicht die gesuchten Posting-/Currency-/Tax-Codes. Sie sind Diagnose-/Kandidaten-Evidence und nicht als finaler Field-Proof fuer die fehlenden Codes geeignet.

## Lernwert fuer Anfaenger

Eine Kreditorenkarte kann fachlich unvollstaendig wirken, obwohl der Datensatz existiert. Business Central blendet je nach Rolle, FastTab, Personalisierung oder Page-Layout Felder aus. Deshalb muss man vor einer Einkaufsrechnung unterscheiden: Ist ein Wert falsch, fehlt er im Setup, oder ist er nur in der aktuellen Ansicht nicht sichtbar?

## Buchwirkung

Kapitel 21 bekommt damit einen klaren Diagnosepunkt vor dem Anlagenkauf: Erst die Kreditorenkarte und ihre buchungsrelevanten Defaults sichtbar machen, dann Kaufbeleg vorbereiten. Das ist CRONUS-USA-Labor und kein deutscher USt-/Kontenplan-/HGB-Finalnachweis.

## Grenzen

- Read-only: keine Aenderung an `K30000`.
- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.
- Kein API-Shortcut; die Diagnose basiert auf Business-Central-UI, sichtbaren Controls und Screenshots.
- Nicht sichtbare Felder sind keine finale Aussage, dass das Setup fehlt. Sie sind ein UI-/Sichtbarkeitsbefund.

## Naechster Schritt

FIXEDASSETS-042-K30000-VENDOR-DEFAULTS-VISIBILITY-DECISION: decide whether the remaining missing defaults require guided Personalize/Page Inspection or a narrow setup/field-fit gate before purchase invoice.
