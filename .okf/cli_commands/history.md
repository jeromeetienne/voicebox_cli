---
type: CLI Command
title: history
description: Browse and manage generation history — list, get, stats, favorite, delete, clear-failed, and export.
resource: src/commands/history_command.ts
tags: [cli, history]
timestamp: 2026-07-02
---

# history

Browse and manage past generations. See the
[generation](../data_models/generation.md) data model (the `HistoryItem` shape).

# Subcommands

| Subcommand | Purpose | API |
| --- | --- | --- |
| `history list` | list past generations with a shown/total footer | `GET /history` |
| `history get <id>` | print one generation as JSON | `GET /history/{id}` |
| `history stats` | aggregate statistics (per-profile counts resolved to names) | `GET /history/stats` + `GET /profiles` |
| `history favorite <id>` | toggle the favorite flag | `POST /history/{id}/favorite` |
| `history delete <id>` | delete a generation | `DELETE /history/{id}` |
| `history clear-failed` | delete all failed generations | `DELETE /history/failed` |
| `history export <id>` | export a generation as a zip | `GET /history/{id}/export` |
| `history export-audio <id>` | export a generation's audio | `GET /history/{id}/export-audio` |

# `history list` options

`-p, --profile <id>` (filter by profile id), `-s, --search <text>`,
`--limit <n>`, `--offset <n>`, and `--base-url`. Non-empty filters are sent as
query parameters. Each row is rendered as
`★ id  profile_name  status  "text"`, with text truncated past 60 characters and
a leading star for favorites.

# Notes

- `history stats` post-processes the response: it replaces profile ids in
  `generations_by_profile` with the corresponding profile names.
- `export` defaults its output path to `outputs/<id>.zip`; `export-audio`
  defaults to `outputs/<id>.wav`. Both accept `-o, --output`.

# Examples

```bash
voicebox-cli history list --search "fox" --limit 20
voicebox-cli history favorite 8b21…
voicebox-cli history export-audio 8b21… -o outputs/take.wav
```

# Citations

- [src/commands/history_command.ts](../../src/commands/history_command.ts)
- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — history methods
