# End-to-end scripts

This folder holds **end-to-end (e2e) scripts** for `voicebox-cli`.

## What is an end-to-end script?

An end-to-end script exercises the CLI the same way a real user would: it runs
the published `voicebox-cli` commands against the live API, from start to
finish, and produces a real artifact (an audio file, a transcript, ...).

Unlike unit tests, these scripts:

- talk to the **real backend** — no mocks or stubs;
- drive the **actual CLI binary** (`npx voicebox-cli ...`), not internal
  functions;
- are meant to be **run and observed by a human** — they print progress and
  leave their output under `outputs/` so you can inspect or play it.

They serve as living demos and smoke tests: if an e2e script runs clean, the
command works against the current API.

## Conventions

- Each script demos **one command** and is named `end2end_<command>.sh`.
- Scripts are self-contained: `set -euo pipefail`, then `cd` to the project
  root so relative paths work regardless of where the script is invoked from.
- Generated artifacts are written to `outputs/` (created on demand).
- Progress is printed with `==> ` prefixed lines.

## Scripts

| Script | Command demoed | What it does |
| --- | --- | --- |
| [`end2end_generate_run.sh`](end2end_generate_run.sh) | `generate run` | Synthesizes text to a WAV using the first voice profile. |
| [`end2end_speak.sh`](end2end_speak.sh) | `speak` | Synthesizes text to an MP3 using the first voice profile. |
| [`end2end_transcribe.sh`](end2end_transcribe.sh) | `transcribe` | Generates audio for a sentence, then transcribes it back to text (round-trip). |

## Running

From anywhere in the repo:

```sh
./scripts/end2ends/end2end_speak.sh
```
