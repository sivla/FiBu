# GOVERNANCE-012 Company Autonomy Registry

Status: `governance`, `instance-bound`, `no-bc-run`, `no-company-switch`, `no-company-created`, `no-setup-change`, `no-posting`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `GOVERNANCE-012-COMPANY-AUTONOMY-REGISTRY.md` | Governance-Evidence | warum zuerst eine Company Registry noetig war und welche Autonomie-Regel jetzt gilt | keine live ausgelesene BC-Company-Liste | aktuell |
| `GOVERNANCE-012-result.json` | maschinenlesbarer Befund | Registry erstellt, State/Gates vorbereitet, keine BC-Aktion | keine Company-Anlage, keinen Company-Wechsel | aktuell |
| `../../COMPANY-REGISTRY.md` | Steuerregister | bekannte/geplante Companies, Nutzung, Risiken, naechster Nachweis | keinen finalen DE-Mandanten | aktuell |
| `../../COMPANY-REGISTRY.json` | maschinenlesbares Register | Company-Kontext fuer Folge-Agenten | keine BC-Live-Enumeration | aktuell |

## Ergebnis

Der Lauf setzt die V5-Regel um: Autonomie ist nicht mehr pauschal auf `RM-DEMO` begrenzt, sondern auf die Instanz `MCP_1_20260210`. Company-Wechsel oder neue Labor-Companies sind innerhalb dieser Instanz erlaubt, aber nur mit Registry-Eintrag, dokumentiertem Zweck, Risiko, Evidence-Plan und Rueckfalllogik.

## Grenze

Dieser Lauf hat Business Central nicht geoeffnet. Die Registry basiert auf dem bestehenden Repo-Stand und dem Testdatenmodell. Die sichtbare BC-Company-Liste ist deshalb noch offen.

## Naechster Schritt

`GOVERNANCE-013-COMPANY-LIST-READONLY`: Companies-Seite in `MCP_1_20260210` read-only oeffnen, sichtbare Companies fotografieren, Registry mit `actual-visible`/`not-visible` synchronisieren. Keine Company anlegen, kein Wechsel, kein Setup, keine Buchung.

