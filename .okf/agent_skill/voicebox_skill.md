---
type: Concept
title: voicebox agent skill
description: The bundled voicebox skill (SKILL.md) that teaches an AI agent to drive voicebox-cli for text-to-speech and transcription.
resource: dotclaude_folder/skills/voicebox/SKILL.md
tags: [skill, agent, claude]
timestamp: 2026-07-02
---

# voicebox agent skill

The skill shipped inside the package at
`dotclaude_folder/skills/voicebox/SKILL.md`. The
[install](../cli_commands/install.md) command copies it into an agent folder such
as `.claude`, and the package `files` list includes `dotclaude_folder` so it is
published.

# Frontmatter

- `name`: `voicebox`
- `description`: triggers whenever the user wants to synthesize a voice, read
  text aloud, turn text into an audio / MP3 / WAV file, pick or clone a voice,
  manage voice profiles, or transcribe a recording — and notes that a running
  voicebox server (default `http://127.0.0.1:17493`) is required.

# What it tells the agent to do

1. **Check the server first** with `voicebox-cli health`; if it fails, tell the
   user the server is not running and stop.
2. **Pick the task**: speak (text → audio), list profiles then speak, or
   transcribe (audio → text); anything lower-level defers to `--help`.
3. **Speak** with a named profile, choosing format by output extension
   (`.mp3` encodes locally, everything else is raw WAV).
4. **Discover voices** via `profiles list`, creating a profile and reference
   sample when none exist.
5. **Transcribe** any audio file, with an optional language hint and model.

It also points at the [more commands](../cli_commands/index.md) — `generate`,
`history`, `stories`, `channels`, `models` — for advanced use.

# Citations

- [dotclaude_folder/skills/voicebox/SKILL.md](../../dotclaude_folder/skills/voicebox/SKILL.md)
- [src/commands/install_command.ts](../../src/commands/install_command.ts) — installs this file
