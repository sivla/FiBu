# book chapter draft

# Buchbaustein: Berechtigungsfehler nicht mit Rollenlayout verwechseln

Eine fehlende Schaltflaeche, ein unsichtbares Feld und ein Permission Error sind drei unterschiedliche Befunde. Rollenlayout und Profil erklaeren, was der User sieht. Permission Sets, Effective Permissions und Security Filter erklaeren, was der User darf. Telemetry kann zeigen, welches Objekt oder welche Extension technisch am Fehler beteiligt war.

Die Debugging-Regel lautet:

1. UI Evidence klaert die Sichtbarkeit.
2. Data Evidence klaert Rechte und gespeicherte Werte.
3. Telemetry Evidence klaert technische Fehlerereignisse.
4. Erst der Abgleich aller drei Kanaele macht aus einer Hypothese eine belastbare Ursache.

Keine Rechteaenderung erfolgt ohne Freigabe, Rollback-Plan und Regressionstest.
