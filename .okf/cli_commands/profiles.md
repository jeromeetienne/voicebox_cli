---
type: CLI Command
title: profiles
description: Manage voice profiles and their reference samples (list, get, create, update, delete, presets, export, samples).
resource: src/commands/profiles_command.ts
tags: [cli, profiles, voices]
timestamp: 2026-07-02
---

# profiles

Manage voice profiles and their reference samples. A profile name or id is
required to [speak](./speak.md); a profile id is required to
[generate](./generate.md). See the [voice profile](../data_models/voice_profile.md)
data model.

# Subcommands

| Subcommand | Purpose | API |
| --- | --- | --- |
| `profiles list` | list profiles as `id  name  (language, N samples)` | `GET /profiles` |
| `profiles get <id>` | print one profile as JSON | `GET /profiles/{id}` |
| `profiles create <name>` | create a profile | `POST /profiles` |
| `profiles update <id>` | fetch, merge options, replace | `GET` then `PUT /profiles/{id}` |
| `profiles delete <id>` | delete a profile | `DELETE /profiles/{id}` |
| `profiles presets <engine>` | list an engine's preset voices | `GET /profiles/presets/{engine}` |
| `profiles export <id>` | export a profile as a zip | `GET /profiles/{id}/export` |
| `profiles samples list <profile-id>` | list reference samples | `GET /profiles/{id}/samples` |
| `profiles samples add <profile-id> <file> <reference-text>` | attach an audio sample | `POST /profiles/{id}/samples` |
| `profiles samples update <sample-id> <reference-text>` | change a sample's transcript | `PUT /profiles/samples/{id}` |
| `profiles samples delete <sample-id>` | delete a sample | `DELETE /profiles/samples/{id}` |

# Options for `create` / `update`

`-d, --description`, `-l, --language <code>` (default `en` on create),
`--voice-type <type>`, `--preset-engine <engine>`, `--preset-voice-id <id>`,
`--design-prompt <text>`, `--default-engine <engine>`, `--personality <text>`,
and `--base-url`. `update` also takes `-n, --name`.

Engine and language flags are validated enums. `update` is a full replacement:
the command fetches the current profile, overlays the provided options, and
sends every field back via `PUT`, so unspecified fields are preserved.

# Notes

- `profiles export` writes to `outputs/profile.zip` by default (`-o` to override).
- `profiles samples add` reads the audio file from disk and uploads it as
  multipart form data alongside the reference transcript.

# Examples

```bash
voicebox-cli profiles list
voicebox-cli profiles create "Narrator" --language en --personality "calm and warm"
voicebox-cli profiles samples add <profile-id> sample.wav "This is my reference voice."
```

# Citations

- [src/commands/profiles_command.ts](../../src/commands/profiles_command.ts)
- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — profile and sample methods
