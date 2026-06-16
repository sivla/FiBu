# telemetry

Nicht geprueft / keine Telemetry angebunden. Dieser Fall zeigt nur, welche Query fuer Permission Error genutzt wuerde.

## Query-Zweck

Szenario: `permission-error`

Die Query soll technische Hinweise auf Berechtigungsfehler finden: Zeitpunkt, Correlation ID, User, Company, AL Object Type, AL Object ID und Fehlermeldung.

## KQL-Template

```kql
traces
| where timestamp > ago(24h)
| where message has 'Permission' or customDimensions has 'Permission'
| project timestamp, operation_Id, message, severityLevel, user=tostring(customDimensions.user_Id), company=tostring(customDimensions.companyName), objectType=tostring(customDimensions.alObjectType), objectId=tostring(customDimensions.alObjectId)
| order by timestamp desc
| take 100
```

## Evidence-Felder

- `timestamp`
- `operation_Id`
- `message`
- `user`
- `company`
- `objectType`
- `objectId`

## Was Telemetry beweist

- dass ein technischer Permission/Error-Kontext aufgetreten sein koennte
- welches Objekt oder welche Extension beteiligt sein koennte
- welche Session oder Correlation ID weiterverfolgt werden sollte

## Was Telemetry nicht beweist

- welches Permission Set fachlich richtig ist
- ob ein Rollenlayout die Ursache ist
- ob eine Rechteaenderung erlaubt waere
- ob der User-Prozess fachlich korrekt ist
