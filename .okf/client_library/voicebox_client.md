---
type: Concept
title: VoiceboxClient
description: A thin, fully-typed HTTP client for the voicebox API with one method per endpoint; also the package's public library entry point.
resource: src/misc/voicebox_client.ts
tags: [library, http-client, api]
timestamp: 2026-07-02
---

# VoiceboxClient

A thin HTTP client for the voicebox TTS API. Every method maps to a single
endpoint: JSON responses are parsed and typed, binary endpoints return raw bytes,
and progress endpoints return async generators of server-sent events. This class
is the package's public library export (`main` / `exports` in
[package.json](../../package.json)) and the object every
[CLI command](../cli_commands/index.md) constructs.

# Construction

```ts
new VoiceboxClient(baseUrl = 'http://127.0.0.1:17493')
```

A trailing slash on `baseUrl` is trimmed. Commands pass `--base-url` through to
the constructor.

# Request plumbing

Private helpers standardize every call:

- `fetchOrThrow` wraps `fetch` and converts a connection failure into an
  actionable error explaining the server is likely not running.
- `requestJson<T>` parses and types the JSON body; `requestBytes` returns a
  `Uint8Array`; `requestVoid` discards the body. All three throw on a non-2xx
  response with a message of the form `METHOD path failed (status): body`.
- `jsonBody` sets `content-type: application/json` and serializes the body.
- `streamEvents` consumes a server-sent event stream, yielding each `data:`
  payload parsed as JSON.

# Method groups

| Group | Representative methods |
| --- | --- |
| Server | `health`, `filesystemHealth`, `shutdown`, `disableWatchdog` |
| Speak / generate | `speak`, `generate`, `retryGeneration`, `regenerateGeneration`, `cancelGeneration`, `waitForCompletion`, `downloadAudio` |
| Transcription | `transcribe` |
| Profiles | `listProfiles`, `getProfile`, `createProfile`, `updateProfile`, `deleteProfile`, `listPresetVoices`, `exportProfile`, and `*ProfileSample*` |
| History | `listHistory`, `getHistory`, `historyStats`, `deleteHistory`, `toggleFavorite`, `clearFailedHistory`, `exportHistory`, `exportHistoryAudio` |
| Channels | `listChannels`, `getChannel`, `createChannel`, `updateChannel`, `deleteChannel`, `getChannelVoices`, `setChannelVoices` |
| Models | `modelStatus`, `loadModel`, `unloadModel`, `unloadModelByName`, `downloadModel`, `cancelModelDownload`, `deleteModel`, `modelsCacheDir`, `streamModelProgress`, `migrateModels`, `streamMigrationProgress` |
| Stories | `listStories`, `getStory`, `createStory`, `updateStory`, `deleteStory`, `exportStoryAudio`, and the `*StoryItem*` timeline editors |

The typed request/response shapes these methods use are documented under
[data_models](../data_models/index.md).

# waitForCompletion

`waitForCompletion(generationId)` opens `GET /generate/{id}/status` and reads the
server-sent event stream, tracking the last status until one reports `completed`
or `failed`, then cancels the reader and returns it. It throws if the stream
closes without any update. This is how [speak](../cli_commands/speak.md) and
[generate](../cli_commands/generate.md) block until audio is ready.

# Citations

- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts)
- [package.json](../../package.json) — `main`, `types`, `exports`
