# Universaarl: den richtigen Mandanten erkennen

Nach der Anlage von `UNIVERSAARL-DE` arbeitet Business Central nicht automatisch in dieser Company. Zuerst muss sichtbar sein, in welchem Mandanten die Seite gerade geoeffnet ist. Oben links im Role Center steht der aktuelle Arbeitsbereich. Wenn dort `UNIVERSAARL-DE` steht, ist die Startseite im richtigen Universaarl-Kontext geoeffnet.

Die Seite `Meine Einstellungen` hilft beim Verstehen des Benutzerkontexts. Dort sieht man Rolle, Arbeitsdatum, Region, Sprache und den Mandantenwert, den Business Central fuer die persoenlichen Einstellungen anzeigt. Dieser Mandantenwert kann vom sichtbaren Arbeitskontext abweichen, wenn eine Seite direkt mit einer bestimmten Company in der URL geoeffnet wurde. Deshalb reicht `Meine Einstellungen` allein nicht aus. Fuer die praktische Arbeit zaehlt der sichtbare Company-Kontext der Seite, auf der man weiterarbeitet.

Der naechste sichere Kontrollpunkt ist die Seite `Firmendaten`. Sie wird fuer `UNIVERSAARL-DE` geoeffnet, bevor Werte eingetragen werden. In den Firmendaten stehen die Grunddaten der Musterfirma: Name, Adresse, Ort, Laender-/Regionscode, Kontaktname, Telefonnr., USt-IdNr., E-Mail und weitere Bereiche wie Zahlungen, Lieferung, Intrastat, Steuerbehoerde und Benutzererfahrung.

Auf einer frisch angelegten Company ohne Daten sind viele Felder leer. Das ist richtig: Die Universaarl GmbH wird nicht aus einer Demofirma kopiert, sondern Schritt fuer Schritt eingerichtet. Erst wenn der Kontext sicher `UNIVERSAARL-DE` ist, werden die Firmendaten bewusst gefuellt. Danach folgen Nummernserien, Buchungsgruppen, USt-Einstellungen, Dimensionen und Stammdaten.

## Klickfolge

1. Business Central im Environment `playthru` oeffnen.
2. `UNIVERSAARL-DE` als Company-Kontext oeffnen.
3. Im Role Center oben links pruefen, ob `UNIVERSAARL-DE` sichtbar ist.
4. Ueber das Zahnrad `Meine Einstellungen` oeffnen und Rolle, Arbeitsdatum, Region und Sprache ansehen.
5. `Meine Einstellungen` ohne `OK` schliessen, wenn nichts geaendert werden soll.
6. Die Seite `Firmendaten` fuer `UNIVERSAARL-DE` oeffnen.
7. Vor jeder Aenderung pruefen, welche Felder leer sind und welche FastTabs vorhanden sind.

## Wichtige Lernpunkte

- Das Role Center zeigt den praktischen Arbeitskontext.
- `Meine Einstellungen` erklaert Benutzer- und Rollenkontext, ist aber nicht alleiniger Beweis fuer den aktiven Mandanten.
- `Firmendaten` ist der erste Setup-Ort fuer die eigene Company.
- Leere Firmendaten sind bei einer No-Data-Company erwartbar.
- Werte werden erst in einem eigenen Setup-Schritt gespeichert.
