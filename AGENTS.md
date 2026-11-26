# AGENTS.md

Instruksjoner for KI-assistenter (GitHub Copilot, Claude, Codex og andre) som jobber i dette repoet.

Reglene står ett sted, så de ikke kommer i utakt:

- **`CLAUDE.md`** – reglene for repoet: prod og staging, hva som ikke kan endres, testing og opprykk. Les hele før du endrer noe.
- **`docs/designregler.md`** – designreglene for plakatene: låste komponenter, farger, typografi og åpne spørsmål.
- **`.claude/skills/ny-mal/SKILL.md`** – oppskriften for å lage eller rette en mal.
- **`node verktoy/sjekk-regler.js`** – kjøres før hver pull request. Skal være grønn.

Alt nytt arbeid gjøres i `staging/` og leveres som pull request. Aldri push direkte til `main`.
