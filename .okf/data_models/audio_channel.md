---
type: Data Model
title: Audio channel
description: An audio output channel that routes voice profiles to output devices.
resource: src/misc/voicebox_client.ts
tags: [data-model, channels, audio-routing]
timestamp: 2026-07-02
---

# Audio channel

An output channel that routes voices to devices. Managed by the
[channels](../cli_commands/channels.md) command.

# Schema

`AudioChannel` (response):

| Field | Type |
| --- | --- |
| `id` | string |
| `name` | string |
| `is_default` | boolean |
| `device_ids` | string[] |
| `created_at` | string |

`AudioChannelInput` (update): optional `name` and `device_ids` (both nullable).
On update the supplied `device_ids` replace the entire set. The voice profiles
assigned to a channel are managed separately through
`GET`/`PUT /channels/{id}/voices`.

# Citations

- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — `AudioChannel`, `AudioChannelInput`
