# CUSTOMER-SETUP-ROUTE-RECOVERY-READFIRST

Status: partially-observed-route-recovery
Setup-Seiten akzeptiert: 3/4

Dieser Lauf prueft echte Business-Central-Routen zu Setup-Seiten fuer Debitoren. Role-Center- oder Suchoverlay-Screenshots zaehlen nicht als Setup-Seitenbeweis.

## Entscheidung nach Screenshot-QA

Der aktuelle Runner bleibt fuer `Geschaeftsbuchungsgruppen / Gen. Business Posting Groups` blockiert, weil die getesteten Such-/Explorer-Routen im Suchoverlay oder Role Center landen. Diese Route wird nicht weiter blind wiederholt. Fuer die naechste lokale Wertauswahl wird stattdessen die staerkere bestehende Universaarl-Foundation-Evidence aus `TARGET-032A` und `TARGET-032B` verwendet: Page 312 ist dort sichtbar, und `INLAND` ist nach Reopen belegt. Das beweist keine Buchungsmatrix, keine USt.-Korrektheit und keine Posting-Readiness.

Nicht ausgefuehrt: kein Edit, kein Save, kein Setup-Write, kein Beleg, keine Buchungsvorschau, keine Buchung, kein API Shortcut.
