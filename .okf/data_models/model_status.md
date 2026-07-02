---
type: Data Model
title: Model status
description: The state of a single downloadable TTS or transcription model as returned by GET /models/status.
resource: src/misc/voicebox_client.ts
tags: [data-model, models]
timestamp: 2026-07-02
---

# Model status

The state of one model, as listed by the [models](../cli_commands/models.md)
command.

# Schema

`ModelStatus`:

| Field | Type | Notes |
| --- | --- | --- |
| `model_name` | string | canonical name used in API calls |
| `display_name` | string | human-readable label |
| `hf_repo_id` | string \| null | HuggingFace repository id |
| `downloaded` | boolean | |
| `downloading` | boolean (optional) | download in progress |
| `size_mb` | number \| null | |
| `loaded` | boolean (optional) | loaded into memory |

`ModelStatusListResponse` wraps these as `{ models: ModelStatus[] }`.

# Download progress

`models progress` and `models download-wait` stream loosely-typed progress
events with optional `progress`, `current`, `total`, `filename`, and `status`
fields; `download-wait` treats `error`, `failed`, `cancelled`, and `canceled` as
terminal failures and uses `GET /models/status` (`downloaded === true`) as the
completion signal.

# Citations

- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — `ModelStatus`, `ModelStatusListResponse`
- [src/commands/models_command.ts](../../src/commands/models_command.ts) — the progress event shape and terminal states
