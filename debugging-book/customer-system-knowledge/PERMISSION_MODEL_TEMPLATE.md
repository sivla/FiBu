# Permission Model Template

## Ziel

Dieses Template beschreibt Rollen, Permission Sets und typische Berechtigungsgrenzen beim Kunden. Es hilft, Permission-Tickets von Rollenlayout- oder Bedienproblemen zu trennen.

## Rollen und Permission Sets

| Rolle/Usergruppe | Permission Sets | Prozesse | Grenzen | Evidence-Hinweis |
|---|---|---|---|---|
|  |  |  |  | Effective Permissions read-only |

## Security Filter

| Tabelle | Filter | Betroffene Rollen | Risiko |
|---|---|---|---|
|  |  |  |  |

## Triage-Regeln

- Unsichtbares Feld ist nicht automatisch fehlende Berechtigung.
- Permission Error ist nicht automatisch Rollenlayout.
- Keine Rechteaenderung ohne Freigabe, Rollback-Plan und Test.
- Production bleibt read-only.
