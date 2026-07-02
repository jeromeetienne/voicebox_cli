---
type: CLI Command
title: install
description: Copy the bundled voicebox agent skill into an AI agent folder such as .claude.
resource: src/commands/install_command.ts
tags: [cli, skill, install]
timestamp: 2026-07-02
---

# install

Copy the bundled [voicebox agent skill](../agent_skill/index.md) (`SKILL.md`)
into an AI agent folder (e.g. `.claude`).

# Usage

```
voicebox-cli install [agent-folder]
```

`agent-folder` defaults to the current directory (`.`).

# Behavior

Copies the bundled `dotclaude_folder/skills/` tree into `<agent-folder>`,
preserving the `skills/...` layout. The source directory is resolved relative to
the compiled module, so it works both from `src/` (via `tsx`) and from `dist/`.
Existing files are overwritten and reported as `updated`; new files are reported
as `created`. The command prints one line per file and a final
`N file(s) → <destination>` summary. It throws if the bundled skill files are
not found.

# Example

```bash
# Install into the .claude folder of the current project
voicebox-cli install .claude
```

# Citations

- [src/commands/install_command.ts](../../src/commands/install_command.ts)
- [dotclaude_folder/skills/voicebox/SKILL.md](../../dotclaude_folder/skills/voicebox/SKILL.md) — the file that is copied
