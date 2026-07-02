---
type: Data Model
title: Story
description: A multi-clip story and the timeline items it is composed of, as returned and accepted by the story endpoints.
resource: src/misc/voicebox_client.ts
tags: [data-model, stories, timeline]
timestamp: 2026-07-02
---

# Story

A multi-clip timeline assembled from past generations. Managed by the
[stories](../cli_commands/stories.md) command.

# Schema

`Story` (list view): `id`, `name`, `description` (nullable), `created_at`,
`updated_at`, `item_count`.

`StoryDetail` (`GET /stories/{id}`): the same fields as `Story` but with an
`items` array in place of `item_count`.

`StoryItem` (one clip on the timeline):

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | |
| `story_id` | string | |
| `generation_id` | string | source [generation](./generation.md) |
| `version_id` | string \| null | pinned version, if any |
| `start_time_ms` | number | position on the timeline |
| `track` | number | track index |
| `trim_start_ms` / `trim_end_ms` | number | trim in ms |
| `profile_id` / `profile_name` | string | |
| `text` | string | |
| `language` | string | |
| `audio_path` | string | |
| `duration` | number | |
| `volume` | number | linear gain (0.0–2.0) |
| `created_at` | string | |

# Inputs

- `StoryInput`: `name` (required), optional `description`.
- `StoryItemInput`: `generation_id` (required), optional `start_time_ms`,
  `track`.
- `StoryItemTime`: a `generation_id` + `start_time_ms` pair used by the batch
  `items times` update.

# Citations

- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — `Story`, `StoryDetail`, `StoryItem`, `StoryInput`, `StoryItemInput`, `StoryItemTime`
