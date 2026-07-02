---
name: voicebox
description: >-
  Generate speech from text (text-to-speech / TTS) and transcribe audio to text
  using the local voicebox API through the `voicebox-cli` command-line tool. Use
  whenever the user wants to synthesize a voice, read text aloud, turn text into
  an audio / MP3 / WAV file, pick or clone a voice, manage voice profiles, or
  transcribe a recording to text. Requires a running voicebox server (default
  http://127.0.0.1:17493).
---

# voicebox — text-to-speech and transcription

`voicebox-cli` is a command-line client for the voicebox TTS API. It turns text
into speech with a chosen voice, and transcribes audio back into text. Always
run it through `npx` from any directory (Node >= 20):

```bash
npx voicebox-cli <command> [options]
```

## Before you start: is the server up?

Every command talks to a voicebox server (default `http://127.0.0.1:17493`).
Check it first; if this fails, the server is not running and nothing else will
work.

```bash
npx voicebox-cli health
```

If `npx voicebox-cli health` fails, inform the user that the voicebox server is
not running and that they must start it before any command can succeed. Do not
attempt further commands until the user confirms the server is up.

Point at a server on another host/port by passing `--base-url <url>` to any
command.

## Pick the task from what the user asked

- **"say / read aloud / turn this into speech / make an MP3 of…"** → Speak.
- **"what voices are there / which profile…"** → List profiles, then Speak.
- **"transcribe / what does this recording say / audio → text"** → Transcribe.
- Anything lower-level (seeds, chunking, timelines, model management) → see
  **More commands** and run `npx voicebox-cli <command> --help`.

## Speak: text → audio file

`speak` synthesizes text with a named voice profile and writes an audio file.
The output extension controls the format: `.mp3` encodes to MP3 locally; all
other extensions produce a raw WAV file regardless of the extension used. No
other output formats (e.g. FLAC, OGG) are supported by `speak`.

```bash
# Simplest: text + voice profile → hello.mp3
npx voicebox-cli speak "Hello there" --profile Test --output outputs/hello.mp3

# Another language with a matching voice
npx voicebox-cli speak "Bonjour tout le monde" --profile manukipu --language fr

# Rewrite the text in the profile's character before speaking
npx voicebox-cli speak "Tell me about your day." --profile donaldy --personality
```

Key options: `-p/--profile <name-or-id>` (required), `-o/--output <path>`,
`-l/--language <code>`, `-e/--engine <engine>`, `--personality`,
`--base-url <url>`.

## Discover voices: profiles

You need a profile name (or id) to speak. List what the server has, then use one:

```bash
npx voicebox-cli profiles list
npx voicebox-cli speak "Hello there" --profile <name> -o outputs/hello.mp3
```

If the list is empty, create a profile first with
`npx voicebox-cli profiles create` (and optionally add a reference sample).
Only then can you run `speak`.

To create a new cloned voice, make a profile and add a reference sample:

```bash
npx voicebox-cli profiles create "Narrator" --language en --personality "calm and warm"
npx voicebox-cli profiles samples add <profile-id> sample.wav "This is my reference voice."
```

## Transcribe: audio file → text

`transcribe` prints the transcript of an audio file to stdout. Non-WAV inputs
(MP3, Opus, FLAC, …) are converted to WAV locally before upload.

```bash
# Audio file → transcript on stdout
npx voicebox-cli transcribe outputs/take.wav

# Give a language hint and choose a model for better accuracy
npx voicebox-cli transcribe outputs/take.wav --language en --model whisper-turbo

# Save the transcript to a file
npx voicebox-cli transcribe outputs/take.wav > outputs/take.txt
```

Pass `list` to any enum option to print its accepted values, e.g.
`npx voicebox-cli transcribe file.wav --model list`.

## More commands

Each of these has its own `--help`:

- `generate` — low-level generation by profile **id** with seed, instruct
  prompt, model size, chunking, crossfade; also retry / regenerate / cancel /
  status of a job.
- `history` — browse, search, favorite, export, and delete past generations.
- `stories` — assemble multi-clip stories on a timeline and export mixed audio.
- `channels` — route voices to audio output devices.
- `models` — download, load, unload, and inspect TTS/transcription models.
- `health`, `shutdown`, `watchdog` — server status and lifecycle.

Run `npx voicebox-cli --help` for the full command tree.
