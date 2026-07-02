---
type: Concept
title: AudioConvert
description: Audio transcoding helpers (WAV to MP3, and any format to WAV) backed by the bundled ffmpeg-static binary, piping through stdin/stdout.
resource: src/misc/audio_convert.ts
tags: [library, audio, ffmpeg]
timestamp: 2026-07-02
---

# AudioConvert

Audio transcoding helpers backed by the bundled
[`ffmpeg-static`](https://www.npmjs.com/package/ffmpeg-static) binary. Because
the binary ships with the package, the host does not need `ffmpeg` installed.
All conversion pipes bytes through ffmpeg's stdin/stdout, so nothing touches the
filesystem.

# Methods

| Method | Purpose |
| --- | --- |
| `wavToMp3(wav, bitrate = '192k')` | encode WAV bytes to MP3 with `libmp3lame` at the given bitrate |
| `toWav(input)` | decode any ffmpeg-readable audio (MP3, Opus, FLAC, …) to WAV; the input format is auto-detected |

Both throw if `ffmpeg-static` provided no binary for the current platform, or if
ffmpeg exits non-zero (the captured stderr is included in the error).

# Callers

- [speak](../cli_commands/speak.md) and [generate](../cli_commands/generate.md)
  call `wavToMp3` when the output path ends in `.mp3`.
- [transcribe](../cli_commands/transcribe.md) calls `toWav` on any non-WAV input
  before upload.

# Citations

- [src/misc/audio_convert.ts](../../src/misc/audio_convert.ts)
