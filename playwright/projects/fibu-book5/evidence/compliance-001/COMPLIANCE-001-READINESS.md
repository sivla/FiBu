# COMPLIANCE-001 Readiness

Status: `labor`, `read-only`, `compliance-readiness`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Buchkapitel | Kapitel 22 USt, E-Rechnung und deutsche Nachweissicht |
| Referenzbelege | O2C `PS-INV103297`, P2P `108219` nur als bestehende Laborbelege; dieser Lauf bucht nichts |
| Setup-Aenderung | nein |
| Buchung | nein |
| Versand/Peppol/E-Rechnung | nein |

## Gepruefte UI-Einstiege

| Tell-Me-Suche | Ergebnis | Bedeutung fuer Anfaenger | Screenshot |
|---|---|---|---|
| E-Rechnungen | sichtbar/kontextuell sichtbar | Hier beginnt der technische Nachweis fuer strukturierte Rechnungen; Sichtbarkeit ist noch kein Versand- oder Formatnachweis. | compliance-001-010-e-invoices-tell-me.png |
| VAT Entries | sichtbar/kontextuell sichtbar | USt-Posten sind der Nachweis nach einer Buchung; in RM-DEMO ist das noch CRONUS-USA-Labor, kein deutscher 19-%-Beweis. | compliance-001-020-vat-entries-tell-me.png |
| VAT Posting Setup | sichtbar/kontextuell sichtbar | Die Matrix erklaert, warum Steuerbetraege entstehen; sie darf ohne Gate nicht auf deutsches VAT19 umgestellt werden. | compliance-001-030-vat-posting-setup-tell-me.png |
| Document Sending Profiles | sichtbar/kontextuell sichtbar | Versandprofile betreffen Ausgabe und Versand; sie ersetzen keine E-Rechnungsvalidierung und keinen Steuerposten. | compliance-001-040-document-sending-profiles-tell-me.png |
| Change Log Entries | sichtbar/kontextuell sichtbar | Das Change Log zeigt Setup-/Stammdaten-Aenderungen, wenn es passend eingerichtet ist; dieser Lauf aktiviert nichts. | compliance-001-050-change-log-entries-tell-me.png |
| Change Log Setup | sichtbar/kontextuell sichtbar | Hier wuerde festgelegt, was protokolliert wird; Aktivierung ist eine Setup-Aenderung und braucht Freigabe. | compliance-001-060-change-log-setup-tell-me.png |

## Lernbefund

- Compliance ist kein einzelner Button. Fuer das Buch muessen Steuerlogik, E-Rechnungs-/Versandstatus, Change Log und Postenspur getrennt erklaert werden.
- Sichtbare Einstiegspfade beweisen nur, dass ein Leser dort nachsehen oder weiter pruefen kann. Sie beweisen nicht, dass deutsches VAT19-, GoBD- oder E-Rechnungs-Setup fachlich fertig ist.
- In RM-DEMO bleibt die Steuergrenze aus `TAX-001` bestehen: O2C/P2P zeigen im Labor `0 %` Tax; deutsche `19 %` USt ist nicht erreicht.
- Eine E-Rechnung darf im Buch erst als final nachgewiesen gelten, wenn gebuchte Rechnung, E-Dokument/Format, Versand-/Validierungsstatus, USt-Posten und Archiv-/Auditnachweis zusammenpassen.

## Buchwirkung

- Kapitel 22 kann als Readiness-/Orientierungskapitel gegen RM-DEMO vorbereitet werden.
- Finale deutsche Screenshots fuer USt, E-Rechnung, Peppol/Provider, Change Log und Nachweisarchiv bleiben offen.
- Jede Einrichtung an VAT, E-Documents, Change Log oder Versandprofilen braucht ein eigenes Gate und UI-first Klickpfad-Evidence.

## Naechster Schritt

COMPLIANCE-002 ist erledigt. Kapitel 22 ist mit COMPLIANCE-001 synchronisiert und markiert die sichtbaren Einstiegspfade als Readiness. VAT-, E-Rechnung-/E-Documents-, Versandprofil- und Change-Log-Setup bleiben gate-locked. Ohne Gate ist der naechste sichere Schritt `SECURITY-001-READINESS`.
