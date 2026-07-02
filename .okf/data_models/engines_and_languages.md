---
type: Data Model
title: Engines and languages
description: The fixed value sets for TTS engines, language codes, and transcription models accepted by the API and enforced by the CLI.
resource: src/misc/voicebox_client.ts
tags: [data-model, enums, engines, languages]
timestamp: 2026-07-02
---

# Engines and languages

The fixed value sets the API accepts. The CLI enforces them through
[EnumOption](../client_library/enum_option.md); pass `list` to any enum flag to
print the accepted values.

# SPEAK_ENGINES

TTS engines accepted by the API:

```
qwen, qwen_custom_voice, luxtts, chatterbox, chatterbox_turbo, tada, kokoro
```

# SPEAK_LANGUAGES

ISO-639-1 style language codes:

```
zh, en, ja, ko, de, fr, ru, pt, es, it, he, ar, da, el, fi, hi, ms, nl,
no, pl, sv, sw, tr
```

# TRANSCRIBE_MODELS

Whisper model sizes accepted by `POST /transcribe`:

```
whisper-base, whisper-small, whisper-medium, whisper-large, whisper-turbo
```

[transcribe](../cli_commands/transcribe.md) strips the `whisper-` prefix before
sending the value to the API.

# Citations

- [src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts) — `SPEAK_ENGINES`, `SPEAK_LANGUAGES`, `TRANSCRIBE_MODELS`
