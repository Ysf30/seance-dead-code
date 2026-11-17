# Demo fixture — expected graveyard

Files scanned: 5 (src/math.js, src/main.js, src/greet.js, src/unused.js,
src/legacy.py). Files skipped: 0.

## Expected dead items (10, sorted by file then line)

| name | kind | file | line |
|---|---|---|---|
| farewell | export | src/greet.js | 5 |
| default | export | src/greet.js | 9 |
| dead_function | function | src/legacy.py | 9 |
| another_dead | function | src/legacy.py | 13 |
| DeadClass | class | src/legacy.py | 17 |
| unusedThing | import | src/math.js | 4 |
| subtract | export | src/math.js | 10 |
| (unreachable code) | unreachable | src/math.js | 21 |
| secretHelper | function | src/math.js | 24 |
| PI | export | src/math.js | 28 |

## Deliberately alive (must NOT appear)

- `add`, `multiply`, `divide` (math.js) — imported and used by main.js.
- `greet` (greet.js) — imported and used by main.js.
- `unusedThing` export (unused.js) — it IS imported by math.js, so the export
  is alive; only the unused import binding in math.js is dead. This is the
  distinction the tool must get right.
- `living_function`, `LivingClass`, `os`, `json` (legacy.py) — referenced.
