---
type: CLI Command
title: generate
description: Low-level speech generation with full control over the request, plus retry, regenerate, cancel, and status of a job.
resource: src/commands/generate_command.ts
tags: [cli, tts, generate]
timestamp: 2026-07-02
---

# generate

Low-level speech generation with full control over the request. Unlike
[speak](./speak.md), `generate run` takes a profile **id** (not a name) and
exposes seed, instruction prompt, model size, chunking, crossfade, and volume
normalization.

# Subcommands

| Subcommand | Purpose | API |
| --- | --- | --- |
| `generate run <profile-id> <text>` | generate and save audio | `POST /generate` |
| `generate retry <id>` | retry a failed generation | `POST /generate/{id}/retry` |
| `generate regenerate <id>` | regenerate from scratch | `POST /generate/{id}/regenerate` |
| `generate cancel <id>` | cancel an in-progress generation | `POST /generate/{id}/cancel` |
| `generate status <id>` | wait for a job and print its terminal status | `GET /generate/{id}/status` |

# `generate run` options

| Flag | Description | Default |
| --- | --- | --- |
| `-o, --output <path>` | output file (`.mp3` or `.wav`) | `outputs/generation.mp3` |
| `-l, --language <code>` | language code | `en` |
| `--seed <n>` | random seed (integer) | — |
| `--model-size <size>` | model size (e.g. `1.7B`) | — |
| `--instruct <text>` | instruction / style prompt | — |
| `-e, --engine <engine>` | TTS engine | — |
| `--personality` | rewrite the text in-character before TTS | off |
| `--max-chunk-chars <n>` | max characters per chunk for long text | — |
| `--crossfade-ms <n>` | crossfade between chunks in ms | — |
| `--no-normalize` | do not normalize output volume | normalize on |
| `--base-url <url>` | API base url | `http://127.0.0.1:17493` |

Integer options are parsed with a helper that throws on non-numeric input.

# Behavior of `generate run`

Mirrors [speak](./speak.md): submit the [GenerationRequest](../data_models/generation.md)
via `POST /generate`, wait on the status stream, download the WAV via
`GET /audio/{id}`, transcode to MP3 when `--output` ends in `.mp3`, then write the
file. `retry`, `regenerate`, and `cancel` print the resulting job id/status;
`status` prints the terminal status, error (if any), and duration.

# Examples

```bash
# Generate for a specific profile id with a fixed seed, to WAV
voicebox-cli generate run 3f9c… "The quick brown fox." --seed 42 -o outputs/fox.wav

# Long text split into chunks with a crossfade, no volume normalization
voicebox-cli generate run 3f9c… "$(cat script.txt)" --max-chunk-chars 400 --crossfade-ms 80 --no-normalize

# Wait for an existing job and report its status
voicebox-cli generate status 8b21…
```

# Citations

- [src/commands/generate_command.ts](../../src/commands/generate_command.ts)
- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — `generate`, `retryGeneration`, `regenerateGeneration`, `cancelGeneration`, `waitForCompletion`
