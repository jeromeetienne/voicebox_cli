---
type: CLI Command
title: channels
description: Manage audio output channels that route voice profiles to output devices.
resource: src/commands/channels_command.ts
tags: [cli, channels, audio-routing]
timestamp: 2026-07-02
---

# channels

Manage audio output channels that route voices to devices. See the
[audio channel](../data_models/audio_channel.md) data model.

# Subcommands

| Subcommand | Purpose | API |
| --- | --- | --- |
| `channels list` | list channels as `id  name  (flags)` | `GET /channels` |
| `channels get <id>` | print one channel as JSON | `GET /channels/{id}` |
| `channels create <name>` | create a channel (`--device <id...>`) | `POST /channels` |
| `channels update <id>` | update name and/or devices (`-n, --name`, `--device <id...>`) | `PUT /channels/{id}` |
| `channels delete <id>` | delete a channel | `DELETE /channels/{id}` |
| `channels voices <id>` | list assigned voice profiles as JSON | `GET /channels/{id}/voices` |
| `channels set-voices <id> <profile-ids...>` | replace the assigned profiles | `PUT /channels/{id}/voices` |

`--device` is repeatable and, on `update`, replaces the entire device set. The
`list` summary marks the default channel and shows the device count.

# Examples

```bash
voicebox-cli channels create "Studio" --device dev-a --device dev-b
voicebox-cli channels set-voices <channel-id> <profile-id-1> <profile-id-2>
```

# Citations

- [src/commands/channels_command.ts](../../src/commands/channels_command.ts)
- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — channel methods
