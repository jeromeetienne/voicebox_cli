---
type: CLI Command
title: watchdog
description: Control the parent-process watchdog; disable it so the server keeps running after its parent exits.
resource: src/commands/watchdog_command.ts
tags: [cli, lifecycle, watchdog]
timestamp: 2026-07-02
---

# watchdog

Control the parent-process watchdog.

# Subcommands

| Subcommand | Purpose | API |
| --- | --- | --- |
| `watchdog disable` | disable the watchdog so the server keeps running after its parent process exits | `POST /watchdog/disable` |

`--base-url <url>` selects the target server.

# Example

```bash
voicebox-cli watchdog disable
```

# Citations

- [src/commands/watchdog_command.ts](../../src/commands/watchdog_command.ts)
- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — `disableWatchdog`
