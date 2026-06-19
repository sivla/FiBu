# FIXEDASSETS-069 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-069-result.json` | JSON | Nach `FIXEDASSETS-067` und `FIXEDASSETS-068` ist der naechste sinnvolle Purchase-Invoice-Zeilentyp-Schritt approval-gated, weil er `New/Neu` beziehungsweise einen Draft-Pfad benoetigt | keinen Zeilentyp, keinen Draft, keine Buchung | `blocked`, `approval-gate`, `no-bc-run` |

Aktuelle Wahrheit: Ohne ausdrueckliche Freigabe darf der Autopilot `FIXEDASSETS-066` nicht starten. Weitere read-only Probes duerfen Kontext liefern, beweisen aber den Fixed-Asset-Zeilentyp nicht.
