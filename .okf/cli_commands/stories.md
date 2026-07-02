---
type: CLI Command
title: stories
description: Assemble multi-clip stories on a timeline and export mixed audio, including per-item editing (move, trim, split, volume, version).
resource: src/commands/stories_command.ts
tags: [cli, stories, timeline]
timestamp: 2026-07-02
---

# stories

Manage multi-clip stories and the timeline items they are built from. See the
[story](../data_models/story.md) data model.

# Story subcommands

| Subcommand | Purpose | API |
| --- | --- | --- |
| `stories list` | list stories with an item count | `GET /stories` |
| `stories get <id>` | print a story and its items as JSON | `GET /stories/{id}` |
| `stories create <name>` | create a story (`-d, --description`) | `POST /stories` |
| `stories update <id> <name>` | rename / re-describe | `PUT /stories/{id}` |
| `stories delete <id>` | delete a story | `DELETE /stories/{id}` |
| `stories export-audio <id>` | export the story as one mixed file | `GET /stories/{id}/export-audio` |

# Item subcommands (`stories items …`)

| Subcommand | Purpose | API |
| --- | --- | --- |
| `add <story-id> <generation-id>` | add a generation to the timeline (`--start-time-ms`, `--track`) | `POST /stories/{id}/items` |
| `remove <story-id> <item-id>` | remove an item | `DELETE /stories/{id}/items/{item_id}` |
| `times <story-id> <updates...>` | batch-update timecodes from `generationId:startTimeMs` pairs | `PUT /stories/{id}/items/times` |
| `reorder <story-id> <generation-ids...>` | reorder by generation id, recalculating timecodes | `PUT /stories/{id}/items/reorder` |
| `move <story-id> <item-id> <start-time-ms>` | move to a new position/track (`--track`) | `PUT /stories/{id}/items/{item_id}/move` |
| `trim <story-id> <item-id> <trim-start-ms> <trim-end-ms>` | trim start/end | `PUT /stories/{id}/items/{item_id}/trim` |
| `volume <story-id> <item-id> <volume>` | set per-clip linear gain (0.0–2.0) | `PUT /stories/{id}/items/{item_id}/volume` |
| `split <story-id> <item-id> <split-time-ms>` | split into two clips | `POST /stories/{id}/items/{item_id}/split` |
| `duplicate <story-id> <item-id>` | duplicate an item | `POST /stories/{id}/items/{item_id}/duplicate` |
| `version <story-id> <item-id> [version-id]` | pin a generation version (omit to clear) | `PUT /stories/{id}/items/{item_id}/version` |

Numeric arguments are parsed with integer/float helpers that throw on
non-numeric input. `times` parses each `generationId:startTimeMs` pair on the
last `:` so generation ids containing colons are handled. `export-audio`
defaults its output to `outputs/<id>.wav` (`-o` to override).

# Examples

```bash
voicebox-cli stories create "Episode 1" -d "pilot"
voicebox-cli stories items add <story-id> <generation-id> --start-time-ms 0 --track 0
voicebox-cli stories items move <story-id> <item-id> 1500 --track 1
voicebox-cli stories export-audio <story-id> -o outputs/episode1.wav
```

# Citations

- [src/commands/stories_command.ts](../../src/commands/stories_command.ts)
- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — story and story-item methods
