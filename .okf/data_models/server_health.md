---
type: Data Model
title: Server health
description: Server model/GPU/backend health and filesystem health (disk space and per-directory checks).
resource: src/misc/voicebox_client.ts
tags: [data-model, health]
timestamp: 2026-07-02
---

# Server health

Reported by the [health](../cli_commands/health.md) command.

# HealthResponse (`GET /health`)

| Field | Type |
| --- | --- |
| `status` | string |
| `model_loaded` | boolean |
| `model_downloaded` | boolean \| null |
| `model_size` | string \| null |
| `gpu_available` | boolean |
| `gpu_type` | string \| null |
| `vram_used_mb` | number \| null |
| `backend_type` | string \| null |
| `backend_variant` | string \| null |
| `gpu_compatibility_warning` | string \| null |

# FilesystemHealthResponse (`GET /health/filesystem`)

`healthy` (boolean), `disk_free_mb` / `disk_total_mb` (number \| null), and
`directories`: an array of `DirectoryCheck` (`path`, `exists`, `writable`,
`error`).

# Citations

- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — `HealthResponse`, `FilesystemHealthResponse`, `DirectoryCheck`
