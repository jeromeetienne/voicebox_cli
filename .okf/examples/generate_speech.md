---
type: Concept
title: generate_speech example
description: A minimal TypeScript program showing how to use VoiceboxClient and AudioConvert directly as a library.
resource: examples/generate_speech.ts
tags: [example, library]
timestamp: 2026-07-02
---

# generate_speech example

A minimal program that uses the library directly rather than the CLI. It mirrors
what the [speak](../cli_commands/speak.md) command does:

1. Read `text`, `profile`, and `output` from `process.argv` (with defaults).
2. `client.speak({ text, profile })` to queue a generation.
3. `client.waitForCompletion(id)` to block on the status stream.
4. `client.downloadAudio(id)`, then `AudioConvert.wavToMp3` when the output ends
   in `.mp3`, and write the file.

# Run

```bash
tsx examples/generate_speech.ts "Hello from the client" Test outputs/speech.mp3
```

# Citations

- [examples/generate_speech.ts](../../examples/generate_speech.ts)
- [VoiceboxClient](../client_library/voicebox_client.md)
- [AudioConvert](../client_library/audio_convert.md)
