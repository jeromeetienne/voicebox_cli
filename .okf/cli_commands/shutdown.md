---
type: CLI Command
title: shutdown
description: Gracefully shut down the API server; refuses to proceed without explicit confirmation.
resource: src/commands/shutdown_command.ts
tags: [cli, lifecycle]
timestamp: 2026-07-02
---

# shutdown

Gracefully shut down the API server.

# Usage

```
voicebox-cli shutdown [options]
```

# Options

| Flag | Description |
| --- | --- |
| `-y, --yes` | skip the confirmation prompt |
| `--base-url <url>` | API base url |

# Behavior

The command refuses to proceed and throws unless `--yes` is passed; with `--yes`
it sends `POST /shutdown` and prints `shutdown requested`.

# Example

```bash
voicebox-cli shutdown --yes
```

# Citations

- [src/commands/shutdown_command.ts](../../src/commands/shutdown_command.ts)
- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — `shutdown`
