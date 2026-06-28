# telemetry

Nicht geprueft / keine Telemetry angebunden. Fuer dieses Ticket waere zuerst das Szenario `permission-error` sinnvoll, falls Zeitpunkt, User oder Correlation ID vorhanden sind.

## Moegliche Query

```kql
traces
| where timestamp > ago(24h)
| where message has 'Permission' or customDimensions has 'Permission'
| project timestamp, operation_Id, message, user=tostring(customDimensions.user_Id), company=tostring(customDimensions.companyName), objectType=tostring(customDimensions.alObjectType), objectId=tostring(customDimensions.alObjectId)
| order by timestamp desc
| take 100
```

## Evidence-Nutzen

- technischer Permission-Kontext
- Objektbezug
- Session/Correlation ID
- Abgleich mit Effective Permissions

## Grenze

Telemetry allein beweist nicht, ob der Kunde falsch bedient, Setup fehlt oder ein Bug vorliegt.
