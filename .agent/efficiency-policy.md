# Effizienz-Policy

Diese Policy beschreibt, wie wir langfristig herausfinden, welche Agenten-, Skill- und Context-Regeln wirklich effizient sind.

## Prinzipien aus OpenAI-Best-Practices

- Wiederholbare Arbeitsweisen gehoeren in durable Guidance und Skills, nicht in immer groessere Prompts.
- Skills sollen fokussiert sein und progressive disclosure nutzen: erst Name/Beschreibung, dann nur bei Bedarf volle Anweisungen.
- Deterministische Teile gehoeren in Scripts und Checks; das Modell soll Kontext- und Urteilsarbeit leisten.
- Subagents helfen gegen Context-Verschmutzung, kosten aber selbst Tokens und sollen begrenzt, spezialisiert und zusammenfassend arbeiten.
- Skill-Qualitaet sollte mit kleinen Evals/Logs gemessen werden: Ergebnis, Prozess, Stil und Effizienz.

Quellenbasis:

- OpenAI Codex Best Practices: Kontext, wiederverwendbare Guidance, Reasoning passend zur Schwierigkeit, Tests/Review.
- OpenAI Codex Skills: progressive disclosure, fokussierte Skills, explizite Inputs/Outputs, Scripts fuer deterministische Teile.
- OpenAI Codex Subagents: Subagents gegen Context-Verschmutzung, aber mit Tokenkosten und klarer Arbeitsteilung.
- OpenAI Skill-Evals: Erfolg vorab definieren und Outcome/Prozess/Stil/Effizienz klein, aber wiederholt messen.

## Adaptive Budget-Profile

Feste Limits sind nur Startwerte. Ein Lauf darf mehr Dateien oder Skills nutzen, wenn der aktive Case es begruendet.

| Profil | Dateien | Skills | Einsatz |
|---|---:|---:|---|
| `small` | 5 | 2 | Monkey-Arbeit, enge Validierung, schnelle Checks |
| `standard` | 8 | 3 | Normaler Autopilot-Default |
| `expanded` | 14 | 5 | Verbundene Wizard-/Judge-Arbeit mit mehreren Capabilities |
| `deep` | 24 | 10 | Seltene Architektur-, Review- oder Big-Brain-Laeufe |

Mehr Skills sind nicht automatisch schlecht. Schlecht ist eine ungezielte Skill-Sammlung ohne klare Rolle.

## Wann mehr Skills sinnvoll sind

Mehr als drei Skills sind vertretbar, wenn:

- mehrere Capabilities wirklich zusammenarbeiten muessen,
- der Lauf bewusst `expanded` oder `deep` markiert ist,
- der Context-Pack die Skill-Anzahl sichtbar macht,
- das Ergebnis im Usage-Log oder Run-Summary auswertbar bleibt.

Beispiele:

- `posting-gate` + `screenshot-qa` + `evidence-writer` ist ein normaler Prozessnachweis.
- Plus `error-recovery` ist sinnvoll, wenn ein Fehlerfall aktiv untersucht wird.
- Plus `book-sync` und `beginner-check` ist sinnvoll, wenn derselbe Lauf bewusst Buchwirkung aktualisiert.

## Wann weniger besser ist

Weniger Skills sind besser, wenn:

- der Lauf nur liest, klassifiziert oder validiert,
- ein einzelner Helper diagnostiziert wird,
- BC-/FiBu-Urteil nicht betroffen ist,
- der Skill nur "vielleicht" nuetzlich waere.

## Messbare Signale

Wir beobachten:

- `strongModelUseRate`
- `followupRate`
- `averageFilesRead`
- `averageSkillsLoaded`
- ob Capabilities reifer werden
- ob weniger Wiederholungslaeufe entstehen

Die Regel wird angepasst, wenn Daten zeigen:

- zu viele Follow-ups: frueher eskalieren oder besseren Skill laden
- zu viele starke Modelle: Capabilities/Checks haerten und wieder herunterrouten
- zu viele Dateien: Context-Pack und `mustRead` schaerfen
- zu viele Skills: Skill-Zwecke trennen oder Trigger schaerfen

## Arbeitsregel

Nicht fragen: "Wie niedrig koennen wir gehen?"

Fragen:

- Was ist der kleinste Kontext, der diese Aufgabe sicher loest?
- Welche Capability verhindert Wiederholung?
- Welcher deterministische Check ersetzt Modellarbeit?
- Hat ein teurer Lauf mindestens einen billigen Folgefehler verhindert?
