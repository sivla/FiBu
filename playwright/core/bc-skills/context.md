# Context Skill

Use for: Instanz, Company, Page, Frame und sichtbaren fachlichen Kontext vor jeder Aktion sichern.

Do not use for: Werte oder Buchungswirkung behaupten.

Inputs: URL, Page Text, Frame Text, erwartete Instanz, erwartete Company, erwartete Page-Signale.

Outputs: Kontext-JSON mit `instanceOk`, `companyOk`, `pageSignals`, `framesChecked`, `stopIfWrongContext`.

Safety: Bei falscher Instanz oder Company sofort stoppen.
