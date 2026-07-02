---
type: Concept
title: End-to-end scripts
description: Shell scripts that exercise the published CLI against the live API from start to finish, producing a real artifact.
resource: scripts/end2ends
tags: [example, e2e, testing]
timestamp: 2026-07-02
---

# End-to-end scripts

Shell scripts under `scripts/end2ends/` that drive the actual
`npx voicebox-cli` binary against the real backend — no mocks — and leave their
output under `outputs/`. They serve as living demos and smoke tests: a clean run
means the command works against the current API.

# Conventions

- Each script demos one command and is named `end2end_<command>.sh`.
- Scripts are self-contained: `set -euo pipefail`, then `cd` to the project root.
- Generated artifacts are written to `outputs/`.
- Progress is printed with `==> ` prefixed lines.

# Scripts

| Script | Command | What it does |
| --- | --- | --- |
| `end2end_generate_run.sh` | [generate run](../cli_commands/generate.md) | synthesize text to a WAV using the first voice profile |
| `end2end_speak.sh` | [speak](../cli_commands/speak.md) | synthesize text to an MP3 using the first voice profile |
| `end2end_transcribe.sh` | [transcribe](../cli_commands/transcribe.md) | generate audio for a sentence, then transcribe it back (round-trip) |

# Run

```sh
./scripts/end2ends/end2end_speak.sh
```

# Citations

- [scripts/end2ends/README.md](../../scripts/end2ends/README.md)
- [scripts/end2ends/end2end_speak.sh](../../scripts/end2ends/end2end_speak.sh)
- [scripts/end2ends/end2end_generate_run.sh](../../scripts/end2ends/end2end_generate_run.sh)
- [scripts/end2ends/end2end_transcribe.sh](../../scripts/end2ends/end2end_transcribe.sh)
