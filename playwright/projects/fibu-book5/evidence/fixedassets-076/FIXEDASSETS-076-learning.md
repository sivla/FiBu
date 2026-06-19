# FIXEDASSETS-076 Lernnotiz

FA-076 did not prove visible Type = Fixed Asset through direct UI value entry; status=blocked-direct-entry-not-accepted, guard=blocked-item-line-type-visible. Cleanup status=not-created-or-draft-number-not-found.

Dieser Lauf testet nur den Zeilentyp. In Business Central steuert der Zeilentyp, welche Liste und welche Sachlogik im Feld `No.`/`Nr.` danach greift. Solange `Fixed Asset` nicht sichtbar als Zeilentyp nachgewiesen ist, waere die Eingabe von `FA-CNC-01` fachlich unsauber.

Status: CRONUS-/RM-DEMO-Labor, kein deutscher Finalnachweis.
