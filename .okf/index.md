---
okf_version: "0.1"
type: Bundle Index
title: voicebox-cli knowledge bundle
description: Knowledge for voicebox-cli, a command-line client and TypeScript library for the voicebox text-to-speech and transcription API.
timestamp: 2026-07-02
---

# voicebox-cli

`voicebox-cli` is a small TypeScript command-line client for the
[voicebox](http://127.0.0.1:17493) text-to-speech API. It generates speech from
text, waits for the asynchronous job to finish, downloads the audio, and
optionally transcodes it to MP3; it also transcribes audio back to text. The
same code ships as a programmatic library and as a bundled agent skill.

- Package: `voicebox-cli` (see [package.json](../package.json))
- Binary: `voicebox-cli` → [dist/cli.js](../src/cli.ts)
- Default server: `http://127.0.0.1:17493`
- Runtime: Node.js >= 20, ES modules, run via `tsx` in development

## Folders

- [cli_commands](./cli_commands/index.md) — every `voicebox-cli` subcommand, its
  flags, and the API calls it makes.
- [client_library](./client_library/index.md) — the reusable `VoiceboxClient`
  HTTP client and its audio/CLI helpers.
- [data_models](./data_models/index.md) — the request and response shapes
  exchanged with the API.
- [api_reference](./api_reference/index.md) — the upstream voicebox HTTP API the
  client wraps.
- [agent_skill](./agent_skill/index.md) — the bundled `voicebox` skill installed
  into AI agent folders.
- [examples](./examples/index.md) — runnable library example and end-to-end
  scripts.

## Orientation

- Text-to-speech has two entry points: [speak](./cli_commands/speak.md) (simple)
  and [generate](./cli_commands/generate.md) (full control). Both submit a job,
  then wait on a server-sent event status stream before downloading audio.
- Audio is returned as WAV and transcoded to MP3 locally with a bundled ffmpeg
  binary — the host does not need ffmpeg installed. See
  [audio_convert](./client_library/audio_convert.md).
- Every command accepts `--base-url <url>` to target a non-default server.
