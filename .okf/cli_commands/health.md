---
type: CLI Command
title: health
description: Check the API health status, or filesystem health (disk space and per-directory checks) with a flag.
resource: src/commands/health_command.ts
tags: [cli, health, diagnostics]
timestamp: 2026-07-02
---

# health

Check the API health status. This is the first command to run: if it fails, the
voicebox server is not running and no other command will succeed. See the
[server health](../data_models/server_health.md) data model.

# Usage

```
voicebox-cli health [options]
```

# Options

| Flag | Description |
| --- | --- |
| `-f, --filesystem` | check filesystem health instead of model/GPU status |
| `--json` | print the raw JSON response |
| `--base-url <url>` | API base url |

# Behavior

- Default: `GET /health`, then print status, model loaded/size, GPU
  availability/type, backend type/variant, and any GPU compatibility warning.
- `-f/--filesystem`: `GET /health/filesystem`, then print overall health, disk
  free/total in MB, and each managed directory with its exists/writable flags and
  any error.
- `--json`: print the raw response and return early (works with both modes).

# Examples

```bash
voicebox-cli health
voicebox-cli health --filesystem
voicebox-cli health --json
```

# Citations

- [src/commands/health_command.ts](../../src/commands/health_command.ts)
- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — `health`, `filesystemHealth`
