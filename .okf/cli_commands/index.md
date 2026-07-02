# CLI commands

Every subcommand of the `voicebox-cli` binary. The root program is assembled in
[src/cli.ts](../../src/cli.ts), which registers each command group and reads the
`-V`/`--version` value from `package.json` at runtime. Each command constructs a
[VoiceboxClient](../client_library/voicebox_client.md) (honoring `--base-url`)
and calls one or more API endpoints.

Every command accepts `--base-url <url>` to target a non-default server. Options
backed by a fixed value set (engine, language, model) are built with
[EnumOption](../client_library/enum_option.md); pass `list` as the value to print
the accepted values.

## Speech generation

- [speak](./speak.md) — synthesize text to an audio file (simple path).
- [generate](./generate.md) — low-level generation with full request control,
  plus retry / regenerate / cancel / status.
- [transcribe](./transcribe.md) — transcribe an audio file to text.

## Library and history

- [profiles](./profiles.md) — manage voice profiles and their reference samples.
- [history](./history.md) — browse, search, favorite, export, and delete past
  generations.
- [stories](./stories.md) — assemble multi-clip stories on a timeline and export
  mixed audio.
- [channels](./channels.md) — route voice profiles to audio output devices.

## Models and server

- [models](./models.md) — status, load/unload, download, delete, and migration of
  TTS and transcription models.
- [health](./health.md) — API and filesystem health.
- [shutdown](./shutdown.md) — gracefully shut down the server.
- [watchdog](./watchdog.md) — control the parent-process watchdog.

## Setup

- [install](./install.md) — copy the bundled agent skill into an agent folder.
