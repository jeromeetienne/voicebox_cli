---
type: API Endpoint
title: voicebox API
description: The upstream voicebox HTTP API (OpenAPI 3.1.0) that VoiceboxClient wraps; the CLI covers a subset of its endpoints.
resource: data/voicebox_openapi.yaml
tags: [api, openapi, reference]
timestamp: 2026-07-02
---

# voicebox API

The HTTP API served by the voicebox backend (default `http://127.0.0.1:17493`).
The vendored specification is the authoritative contract; the
[VoiceboxClient](../client_library/voicebox_client.md) is a hand-written typed
wrapper over the subset of it that the CLI needs.

# Specification metadata

- Format: OpenAPI `3.1.0`
- Title: `voicebox API`
- Description: `Production-quality Qwen3-TTS voice cloning API`
- Version: `0.5.0`
- Source of truth: [data/voicebox_openapi.yaml](../../data/voicebox_openapi.yaml)
  (~90 paths)

# Endpoints the client wraps

| Group | Representative paths | Wrapped by |
| --- | --- | --- |
| Speak / generate | `POST /speak`, `POST /generate`, `GET /generate/{id}/status`, `POST /generate/{id}/{retry,regenerate,cancel}`, `GET /audio/{id}` | [speak](../cli_commands/speak.md), [generate](../cli_commands/generate.md) |
| Transcription | `POST /transcribe` | [transcribe](../cli_commands/transcribe.md) |
| Profiles | `/profiles`, `/profiles/{id}`, `/profiles/{id}/samples`, `/profiles/samples/{id}`, `/profiles/presets/{engine}`, `/profiles/{id}/export` | [profiles](../cli_commands/profiles.md) |
| History | `/history`, `/history/{id}`, `/history/stats`, `/history/failed`, `/history/{id}/{favorite,export,export-audio}` | [history](../cli_commands/history.md) |
| Stories | `/stories`, `/stories/{id}`, `/stories/{id}/items…` | [stories](../cli_commands/stories.md) |
| Channels | `/channels`, `/channels/{id}`, `/channels/{id}/voices` | [channels](../cli_commands/channels.md) |
| Models | `/models/status`, `/models/{load,unload,download}`, `/models/progress/{name}`, `/models/migrate` | [models](../cli_commands/models.md) |
| Server | `GET /health`, `GET /health/filesystem`, `POST /shutdown`, `POST /watchdog/disable` | [health](../cli_commands/health.md), [shutdown](../cli_commands/shutdown.md), [watchdog](../cli_commands/watchdog.md) |

Note that `POST /transcribe` and `POST /watchdog/disable` are called by the
client but are not among the paths declared in the vendored specification file.

# Endpoints not surfaced by the CLI

The specification also defines endpoint families the CLI does not wrap, including
captures (`/captures…`), generation versions (`/generations/{id}/versions…`),
audio effects (`/effects…`), backend/CUDA management (`/backend/…`), settings
(`/settings/…`), and integration endpoints (`/llm/generate`, `/mcp/bindings…`).

# Citations

- [data/voicebox_openapi.yaml](../../data/voicebox_openapi.yaml)
- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — the wrapping client
