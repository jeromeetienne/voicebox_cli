---
type: CLI Command
title: speak
description: Synthesize text to an audio file with a chosen voice profile (the simple text-to-speech path).
resource: src/commands/speak_command.ts
tags: [cli, tts, speak]
timestamp: 2026-07-02
---

# speak

Generate speech from text and save it as an audio file. This is the simple
text-to-speech path; use [generate](./generate.md) when you need seeds, chunking,
or other low-level control.

# Usage

```
voicebox-cli speak <text> [options]
```

# Options

| Flag | Description | Default |
| --- | --- | --- |
| `-p, --profile <profile>` | voice profile name or id | — |
| `-o, --output <path>` | output file (`.mp3` or `.wav`) | `speech.mp3` |
| `-e, --engine <engine>` | TTS engine (see [engines and languages](../data_models/engines_and_languages.md)) | — |
| `-l, --language <language>` | language code | — |
| `--personality` | rewrite the text in-character before TTS | off |
| `--base-url <url>` | API base url | `http://127.0.0.1:17493` |

# Behavior

1. `POST /speak` with the text and options ([SpeakRequest](../data_models/generation.md)); prints the queued generation id and status.
2. Wait for completion by consuming the `GET /generate/{id}/status` server-sent event stream; throw if the terminal status is `failed`.
3. `GET /audio/{id}` to download the WAV bytes.
4. If `--output` ends in `.mp3` (case-insensitive), transcode to MP3 with [AudioConvert](../client_library/audio_convert.md); otherwise write the raw WAV.
5. Write the file and print the byte count and duration.

# Examples

```bash
# Simplest: text + voice profile → speech.mp3 (the default output)
voicebox-cli speak "Hello there" --profile Test

# French with a matching voice, saved to a specific file
voicebox-cli speak "Bonjour tout le monde" --profile manukipu --language fr -o outputs/bonjour.mp3

# Rewrite the text in the profile's character before speaking
voicebox-cli speak "Tell me about your day." --profile donaldy --personality
```

# Citations

- [src/commands/speak_command.ts](../../src/commands/speak_command.ts)
- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — `speak`, `waitForCompletion`, `downloadAudio`
