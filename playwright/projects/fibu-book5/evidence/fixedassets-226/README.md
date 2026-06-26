# FIXEDASSETS-226 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| 010-prepost-preview-detail.json | JSON | Pre-post Preview Posting detail signals | keine gebuchten Posten | labor/preflight |
| 011-prepost-preview-detail-text.txt | Text | sichtbare Preview-Detailzeilen | keine Buchung allein | labor/preflight |
| 015-prepost-target-line-recheck.json | JSON | Zielzeile unmittelbar vor Post | keine Posten | labor/preflight |
| 020-posting-dialog.txt | Text | Buchungsdialog vor Bestaetigung | keine Posten vor Ja/OK | process-proof |
| 025-post-result.txt | Text | Zustand nach Bestaetigung | allein keine vollstaendige Postenspur | labor |
| 030-posted-entry-trace.json | JSON | G/L-/FA-Ledger-Trace-Bewertung | keinen deutschen Finalnachweis | posting-trace |
| 030-gl-entry-trace-page-text.txt | Text | gefilterte Sachposten | keine FA-Ledger-Details | posting-trace |
| 040-fa-ledger-entry-trace-page-text.txt | Text | abgelehnter Anlagenposten-Trace-Pfad: leere FA Ledger Entries Preview-Ansicht | keine gebuchten Anlagenposten | rejected-trace-path |
| FIXEDASSETS-226-result.json | JSON | Gesamtergebnis, Safety Flags, Buchungsstatus, offener Trace-Blocker | keinen deutschen Finalnachweis | blocked-partial-trace |
| FIXEDASSETS-226-LAB-POSTING.md | Markdown | Lernzusammenfassung mit gebuchter Sachpostenspur und offenem Anlagenposten-Trace | keine finale Buchstelle | labor |

Aktuelle Wahrheit: FA-226 hat genau einmal im CRONUS-USA-Labor gebucht. Die Sachposten zu `G05001` sind sichtbar (`82000`/`12210`, `+/-120.000,00`). Der Anlagenposten-Nachweis ist noch nicht erbracht, weil der Versuch ueber Page `5606` eine leere `FA Ledger Entries Preview`-Ansicht zeigte. Das ist ein abgelehnter Trace-Pfad, kein Beweis fuer fehlende Anlagenposten.

Naechster Schritt: `FIXEDASSETS-227-FA-GL-JOURNAL-POSTED-TRACE-REVIEW` sucht den gebuchten Anlagenposten read-only. FA-226 darf nicht ohne neuen Duplicate-Risk-Case wiederholt werden.
