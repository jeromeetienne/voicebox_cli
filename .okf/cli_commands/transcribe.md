---
type: CLI Command
title: transcribe
description: Transcribe an audio file to text, converting non-WAV inputs to WAV locally before upload.
resource: src/commands/transcribe_command.ts
tags: [cli, transcription, whisper]
timestamp: 2026-07-02
---

# transcribe

Transcribe an audio file to text. The transcript is printed to stdout (or the
raw JSON response with `--json`).

# Usage

```
voicebox-cli transcribe <file> [options]
```

# Options

| Flag | Description |
| --- | --- |
| `-l, --language <language>` | language hint (a `SPEAK_LANGUAGES` code) |
| `-m, --model <model>` | transcription model (a `TRANSCRIBE_MODELS` value, see [engines and languages](../data_models/engines_and_languages.md)) |
| `--json` | print the raw JSON response |
| `--base-url <url>` | API base url |

# Behavior

1. Read the input file from disk.
2. If the extension is not `.wav`, transcode to WAV with [AudioConvert.toWav](../client_library/audio_convert.md) (so MP3, Opus, FLAC, and any other ffmpeg-readable format is accepted). The uploaded filename keeps the base name with a `.wav` extension.
3. Strip the `whisper-` prefix from `--model` before sending (the API expects the bare size, e.g. `turbo`).
4. `POST /transcribe` as multipart form data with the audio file and optional `language`/`model` fields.
5. Print `result.text`, or the pretty JSON with `--json`. If the response has no text, throw an error suggesting the model may still be loading.

# Examples

```bash
# Audio file → transcript on stdout
voicebox-cli transcribe outputs/take.wav

# Language hint and a specific model
voicebox-cli transcribe outputs/take.mp3 --language en --model whisper-turbo

# Save the transcript to a file
voicebox-cli transcribe outputs/take.wav > outputs/take.txt
```

# Citations

- [src/commands/transcribe_command.ts](../../src/commands/transcribe_command.ts)
- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — `transcribe`
- [src/misc/audio_convert.ts](../../src/misc/audio_convert.ts) — `toWav`
