# Regression Test

## Ziel

Der Test soll pruefen, ob eine Anleitung fuer Verkaufszeilen robust bleibt, wenn die Spalte `Location Code` nicht sichtbar ist.

## Testplan

1. Sales Order in Testumgebung oeffnen.
2. Verkaufszeilenbereich fotografieren.
3. Pruefen, ob `Location Code` sichtbar ist.
4. Wenn nicht sichtbar: Personalisieren/Profile-Hinweis ausgeben.
5. Page Inspection dokumentieren.
6. Kein Speichern, keine Buchung.

## Assertions

```text
pageContext = Sales Order
lineContextVisible = true
locationCodeVisible = true OR visibilityDiagnosisDocumented = true
posted = false
profileChanged = false unless explicit approval
```

## Regression-Regel

Eine Klickanleitung darf nicht voraussetzen, dass jede Spalte in jedem Profil sichtbar ist. Sie braucht einen Sichtbarkeits-Check oder einen Hinweis zur Personalisierung.
