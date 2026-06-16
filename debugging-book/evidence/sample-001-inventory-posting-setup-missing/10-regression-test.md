# Regression Test

## Ziel

Der Test soll sicherstellen, dass die Kombination `FRA-ZL` + `RESALE` nicht mehr ohne Inventory Account bleibt und dass Preview Posting nicht mehr an diesem alten Fehler stoppt.

## Testplan

1. Read-only Setup pruefen.
2. Erwartete Kombination suchen.
3. `Inventory Account` darf nicht leer sein.
4. Preview Posting fuer einen Testauftrag starten.
5. Alter Fehlertext darf nicht erscheinen.
6. Es wird nicht gebucht, ausser es gibt ein separates Posting-Gate.

## Assertions

```text
oldInventoryPostingErrorPresent = false
previewOpened = true
postingCommitted = false
```
