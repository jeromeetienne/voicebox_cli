---
type: Data Model
title: Voice profile
description: A voice profile and its reference samples, as returned and accepted by the profile endpoints.
resource: src/misc/voicebox_client.ts
tags: [data-model, profiles]
timestamp: 2026-07-02
---

# Voice profile

The voice a generation speaks with. Managed by the
[profiles](../cli_commands/profiles.md) command.

# Schema

`VoiceProfile` (response):

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | |
| `name` | string | |
| `description` | string \| null | |
| `language` | string | |
| `avatar_path` | string \| null | |
| `effects_chain` | unknown[] \| null | |
| `voice_type` | string | e.g. cloned |
| `preset_engine` | string \| null | |
| `preset_voice_id` | string \| null | |
| `design_prompt` | string \| null | |
| `default_engine` | string \| null | |
| `personality` | string \| null | in-character rewrite prompt |
| `generation_count` | number | |
| `sample_count` | number | |
| `created_at` | string | |
| `updated_at` | string | |

`VoiceProfileInput` (create/replace) requires `name` and accepts optional
`description`, `language`, `voice_type`, `preset_engine`, `preset_voice_id`,
`design_prompt`, `default_engine`, and `personality`. Because `PUT /profiles/{id}`
is a full replacement, [profiles update](../cli_commands/profiles.md) merges over
the current profile before sending.

`ProfileSample` (a reference sample): `id`, `profile_id`, `audio_path`,
`reference_text`.

# Citations

- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — `VoiceProfile`, `VoiceProfileInput`, `ProfileSample`
