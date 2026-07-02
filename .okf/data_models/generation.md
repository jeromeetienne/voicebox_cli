---
type: Data Model
title: Generation
description: The speak/generate request bodies, the generation record they return, the streamed status event, and the history item shape.
resource: src/misc/voicebox_client.ts
tags: [data-model, generation, history]
timestamp: 2026-07-02
---

# Generation

The core text-to-speech unit produced by [speak](../cli_commands/speak.md) and
[generate](../cli_commands/generate.md) and later browsed via
[history](../cli_commands/history.md).

# Request bodies

`SpeakRequest` (`POST /speak`): `text` (required), optional `profile`, `engine`
([SpeakEngine](./engines_and_languages.md)), `personality`, `language`
([SpeakLanguage](./engines_and_languages.md)).

`GenerationRequest` (`POST /generate`): `profile_id` and `text` (required), plus
optional `language`, `seed`, `model_size`, `instruct`, `engine`, `personality`,
`max_chunk_chars`, `crossfade_ms`, `normalize`, and `effects_chain`.

# Responses

`GenerationResponse` (returned when a job is queued):

| Field | Type |
| --- | --- |
| `id` | string |
| `profile_id` | string |
| `text` | string |
| `language` | string |
| `audio_path` | string \| null |
| `duration` | number \| null |
| `seed` | number \| null |
| `engine` | string \| null |
| `status` | string |
| `error` | string \| null |
| `created_at` | string |

`GenerationStatus` (each event from `GET /generate/{id}/status`): `id`, `status`,
`duration`, `error`, `source`. [waitForCompletion](../client_library/voicebox_client.md)
returns the event whose `status` is `completed` or `failed`.

`HistoryItem` extends the generation record with `profile_name`, `model_size`,
and `is_favorited`. `HistoryListResponse` wraps `items` with a `total` count;
`HistoryListParams` carries the `profileId`, `search`, `limit`, and `offset`
filters.

# Citations

- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — `SpeakRequest`, `GenerationRequest`, `GenerationResponse`, `GenerationStatus`, `HistoryItem`, `HistoryListResponse`, `HistoryListParams`
