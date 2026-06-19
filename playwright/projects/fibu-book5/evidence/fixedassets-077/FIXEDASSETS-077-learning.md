# FIXEDASSETS-077 Lernnotiz

FA-077 did not prove visible Type = Fixed Asset through the Purchase Order line route; status=blocked-fixed-asset-not-visible, guard=blocked-missing-purchase-invoice-lines-context. Cleanup status=deleted.

Dieser Lauf prueft bewusst eine andere Belegroute. Wenn auch Einkaufsbestellungen den Zeilentyp `Fixed Asset` nicht sichtbar machen, ist der naechste sinnvolle Schritt keine weitere Klickwiederholung, sondern eine Setup-/Page-Capability-Pruefung: Ist das Feld auf der Page verfuegbar, personalisierbar oder durch Rolle/Lokalisierung/Feature eingeschraenkt?

Status: CRONUS-/RM-DEMO-Labor, kein deutscher Finalnachweis.
