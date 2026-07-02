---
type: CLI Command
title: models
description: Manage TTS and transcription models — status, load/unload, download (with live progress), delete, cache directory, and migration.
resource: src/commands/models_command.ts
tags: [cli, models, download]
timestamp: 2026-07-02
---

# models

Manage TTS models: status, load/unload, download, and migration. See the
[model status](../data_models/model_status.md) data model.

# Subcommands

| Subcommand | Purpose | API |
| --- | --- | --- |
| `models status` | one line per model with download/loaded state | `GET /models/status` |
| `models load [size]` | load the default model (optional size) | `POST /models/load` |
| `models unload [name]` | unload the default model, or a named one | `POST /models/unload` or `POST /models/{name}/unload` |
| `models download <name>` | trigger a download | `POST /models/download` |
| `models download-wait <name>` | download with live progress, block until done | `POST /models/download` + `GET /models/progress/{name}` + polled `GET /models/status` |
| `models cancel-download <name>` | cancel/dismiss an errored or stale task | `POST /models/download/cancel` |
| `models delete <name>` | delete a downloaded model from the cache | `DELETE /models/{name}` |
| `models cache-dir` | print the model cache directory | `GET /models/cache-dir` |
| `models progress <name>` | stream raw download progress events | `GET /models/progress/{name}` |
| `models migrate <destination>` | move all models to a new directory | `POST /models/migrate` |
| `models migrate-progress` | stream an in-flight migration's progress | `GET /models/migrate/progress` |

# download-wait

`download-wait` is the convenience path. It first checks `models status` and
returns early if the model is already downloaded. Otherwise it starts the
download and drives a live progress line from the `GET /models/progress/{name}`
server-sent event stream, while **polling** `GET /models/status` every three
seconds as the authoritative completion signal (the progress stream can go quiet
on heartbeats without emitting a terminal event). Terminal error states
(`error`, `failed`, `cancelled`, `canceled`) abort with an error. On a TTY the
progress line redraws in place; otherwise each update is printed on its own line.

# Examples

```bash
voicebox-cli models status
voicebox-cli models download-wait whisper-turbo
voicebox-cli models migrate /new/model/dir
```

# Citations

- [src/commands/models_command.ts](../../src/commands/models_command.ts)
- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — model methods and progress streams
