# Business-Central-Quellen für Buch-5-Aufbau

Diese Datei sammelt Primärquellen, die wir beim Aufbau des Trainingsmandanten verwenden. Quellen ersetzen nicht den Sandbox-Test, aber sie verhindern, dass wir Business-Central-Setup nur aus Erinnerung oder Bauchgefühl ableiten.

## Dimensionen

Microsoft Learn beschreibt Dimensionen als Klassifizierung für Journale und Dokumente. Dimensionen werden auf der Seite `Dimensions` eingerichtet. Zusätzlich können globale Dimensionen und Shortcut-Dimensionen in der Finanzbuchhaltungseinrichtung definiert werden.

Quelle:

- Microsoft Learn: Work with dimensions to track and analyse data  
  https://learn.microsoft.com/en-ca/dynamics365/business-central/finance-dimensions
- Microsoft Learn: Enter data in Business Central  
  https://learn.microsoft.com/en-us/dynamics365/business-central/ui-enter-data
- Microsoft Learn: Keyboard shortcuts in Business Central  
  https://learn.microsoft.com/en-gb/dynamics365/business-central/keyboard-shortcuts

Projektregel:

- Rhein-Main-Dimensionen werden explizit angelegt.
- CRONUS-Dimensionswerte werden nicht stillschweigend umgedeutet.
- Für den Aufbau wird Page `536` (`Dimensions`) verwendet.
- Bei Grid-Eingaben zählt erst der Nachweis nach Fokuswechsel, Speichern und erneutem Öffnen.
- `Ctrl+Enter` kann zum Speichern und Schließen einer Seite genutzt werden; der Test muss trotzdem die Persistenz erneut prüfen.

## Posting Groups

Microsoft Learn beschreibt Posting Groups als Mechanismus, der Entitäten wie Debitoren, Kreditoren, Artikel, Ressourcen und Belege auf Sachkonten abbildet. Für Sales sind insbesondere Customer Posting Group, General Business Posting Group, General Product Posting Group, VAT Business/Product Posting Groups und Inventory Posting Groups relevant.

Quelle:

- Microsoft Learn: Posting group setup  
  https://learn.microsoft.com/en-nz/dynamics365/business-central/finance-posting-groups

Projektregel:

- Wir bauen Posting-Gruppen nicht blind neu.
- Für den ersten Trainingslauf werden vorhandene CRONUS-Posting-Gruppen geprüft und nur bewusst verwendet.
- Neue Rhein-Main-Gruppen entstehen erst, wenn der Buchprozess sie fachlich braucht und wir die Kontenwirkung erklären können.

## Inventory Setup

Microsoft Learn beschreibt Inventory Setup als Voraussetzung für Lagerprozesse, Lagerorte, Kostenbuchung und Bestandsbewertung. Inventory Setup und Inventory Posting Setup sind für Artikelbuchungen und Lagerwert wesentlich.

Quellen:

- Microsoft Learn: Setting up inventory  
  https://learn.microsoft.com/en-gb/dynamics365/business-central/inventory-setup-inventory
- Microsoft Learn: Set up general inventory information  
  https://learn.microsoft.com/en-us/dynamics365/business-central/inventory-how-setup-general

Projektregel:

- `FRA-ZL` wird nicht nur als Code angelegt. Es muss entschieden werden, welche Lagerlogik der Ort im ersten Trainingslauf haben soll.
- Gesteuertes Lager kommt erst, wenn der einfache O2C-/P2P-Fit steht oder der Prozess es ausdrücklich verlangt.
