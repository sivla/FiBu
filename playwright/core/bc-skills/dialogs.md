# Dialogs Skill

Use for: BC-Dialoge, Confirmations, Fehler und Posting-Dialoge lesen.

Do not use for: blindes `OK`, `Yes`, `Post`, `Receive`, `Invoice`.

Inputs: erwarteter Dialogtyp, erlaubte Aktion, verbotene Woerter, Evidence-Ziel.

Outputs: Dialogtext, Buttonliste, Entscheidung `confirmAllowed`.

Safety: Riskante Dialoge ohne Case-Gate abbrechen.
