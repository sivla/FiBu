# FIXEDASSETS-199 Decision

Status: `local-review`, `judge_work`, `no-bc-run`, `no-playwright-run`, `no-posting`, `not-final`.

## Ausgangspunkt

FA-198 hat den exakten `Preview Posting`-Menuepunkt im Fixed Asset G/L Journal geklickt und sofort die Seite `Error Messages` erfasst. Es wurde nicht gebucht, kein `OK`/`Yes` bestaetigt, keine Journalzeile geaendert und kein Setup geaendert.

## Belegter Fehlerkern

- Datensatz: `Gen. Journal Line ASSETS / DEFAULT / 10000`
- UI-Hinweis: `Waehlen Sie einen Wert fuer Batch Name`
- BC-Meldung: `'FA Posting Type' darf in 'Gen. Journal Line' nicht ' ' sein: 'Journal Template Name=ASSETS, Journal Batch Name=DEFAULT, Line No.=10000'`

## Fachliche Einordnung

Die Meldung ist primaer ein Journal-Datenproblem, kein bewiesener Setup-Fehler. Die Zeile existiert im Journal Template `ASSETS`, Batch `DEFAULT`, Line No. `10000`; deshalb wird der Batch-Hinweis als UI-/Details-Hinweis gefuehrt, nicht als belegte fehlende Batch-Anlage.

Microsoft Learn beschreibt fuer den manuellen Anlagenzugang ueber Fixed Asset G/L Journals, dass im Feld `FA Posting Type` der Wert `Acquisition Cost` auszuwaehlen ist. Damit passt der Fehler zu einer unvollstaendigen Journalzeile: Der Anlagenbuchungstyp fehlt.

Quelle: Microsoft Learn, [Acquire fixed assets - Post a fixed asset acquisition manually with a fixed asset G/L journal](https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-acquire).

## Entscheidung

Naechster sicherer Case:

`FIXEDASSETS-200-FA-GL-JOURNAL-FA-POSTING-TYPE-ACQUISITION-PREFLIGHT`

Ziel: Nur die vorhandene Journalzeile `ASSETS / DEFAULT / 10000` wiederfinden, `FA Posting Type = Acquisition Cost` feldnah setzen, nach sicherem Commit/Reopen beweisen und keine Preview/Posting-Aktion ausfuehren.

## Nicht erlaubt

- Kein `Preview Posting`.
- Kein `Post`.
- Kein `Post and Print`.
- Kein `OK`/`Yes` in einem Buchungsdialog.
- Kein Setup Change.
- Keine neue Journalzeile.
- Kein Loeschen.
- Keine Buchaussage als deutscher Finalnachweis.

## Warum kein Setup-Fit

FA-198 zeigt keinen fehlenden Kontenplan- oder Posting-Setup-Eintrag. Der Fehler kommt vor der eigentlichen Kontenfindung: Business Central verlangt zuerst den Anlagenbuchungstyp der Journalzeile.

## Buch-/Lernwert

Fuer Anfaenger ist das ein guter Lernfall: In Anlagenjournalen reicht es nicht, Anlage, Betrag und Gegenkonto zu erfassen. Business Central braucht zusaetzlich den fachlichen Anlagenbuchungstyp, damit es weiss, ob Zugang, AfA, Abgang, Zuschreibung oder eine andere Anlagenbewegung gemeint ist.
