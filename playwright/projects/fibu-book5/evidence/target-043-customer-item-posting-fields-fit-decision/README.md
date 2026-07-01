# TARGET-043 Customer/Item Posting Fields Fit Decision

Status: observed

TARGET-043 war ein lokaler Entscheidungs-Gate ohne BC- oder Playwright-Ausfuehrung.

Entscheidung: TARGET-044 muss als read-only UI Discovery laufen. Die in TARGET-042 fehlenden Felder werden nicht sofort geschrieben, sondern erst ueber FastTabs, Layout, FactBoxes, Page Inspection oder Personalisieren gesucht.

Nicht gemacht:
- kein Business Central geoeffnet
- kein Playwright ausgefuehrt
- keine Einrichtung geaendert
- keine Stammdaten geaendert
- kein Beleg/Draft
- keine Buchungsvorschau
- keine Buchung
