# voicebox-cli

A small TypeScript command-line client for the [voicebox](http://127.0.0.1:17493) TTS API. It generates speech from text, waits for the async job to finish, downloads the audio, and optionally transcodes it to MP3 or Opus.

## Requirements

- Node.js 20+ (developed on v24)
- A running voicebox API (defaults to `http://127.0.0.1:17493`)

`ffmpeg` is **not** required on your system — the bundled [`ffmpeg-static`](https://www.npmjs.com/package/ffmpeg-static) binary is used for transcoding.

## Install

Run it directly with `npx`:

```bash
npx voicebox-cli speak "Hello, world!" --profile Test --output hello.mp3
```

Or install it globally:

```bash
npm install -g voicebox-cli
voicebox-cli speak "Hello, world!" --profile Test --output hello.mp3
```

## Usage

Once installed, the `voicebox-cli` binary is available. During development, run it from source via the `cli` script (uses `tsx`, no build step needed):

```bash
npm run cli -- speak "Hello, world!" --profile Test --output outputs/hello.mp3
```

### `speak`

Synthesize speech from text with a chosen voice profile and save it to a file. The command submits the text to the API, waits for the asynchronous generation to complete, downloads the resulting audio, and writes it locally. Pick the voice with `--profile`, steer synthesis with `--language` and `--engine`, and use `--personality` to rewrite the text in the profile's character before it is spoken.

```
voicebox-cli speak <text> [options]

Options:
  -p, --profile <profile>    voice profile name or id
  -o, --output <path>        output file (.mp3 or .wav)      (default: speech.mp3)
  -e, --engine <engine>      TTS engine
  -l, --language <language>  language code (e.g. en, fr, ja)
  --personality              rewrite the text in-character before TTS
  --base-url <url>           API base url
  -h, --help                 display help for command
```

The output format is chosen from the file extension: `.mp3` transcodes via `ffmpeg-static`, anything else writes the raw WAV returned by the API.

Examples:

```bash
# Simplest: text + voice profile → speech.mp3 (the default output)
voicebox-cli speak "Hello there!" --profile Test

# Save to a specific MP3 file
voicebox-cli speak "Hello there!" --profile Test --output outputs/hello.mp3

# Save as WAV instead (any non-.mp3 extension writes raw WAV)
voicebox-cli speak "Hello there!" --profile Test --output outputs/hello.wav

# French, with a French voice
voicebox-cli speak "Bonjour tout le monde !" --profile manukipu --language fr

# Rewrite the text in the profile's character before speaking
voicebox-cli speak "Tell me about your day." --profile donaldy --personality

# Pick a specific engine
voicebox-cli speak "Testing the kokoro engine." --profile Test --engine kokoro

# Point at a server on another host/port
voicebox-cli speak "Remote server test." --profile Test --base-url http://192.168.1.50:17493

# Using short flags
voicebox-cli speak "Short and sweet." -p Test -o outputs/quick.mp3
```

### `generate`

The low-level counterpart to `speak`. It targets a profile by **id** (not name) and exposes the full generation request: seed, instruction/style prompt, model size, engine, chunking for long text, crossfade, and volume normalization. It also manages the lifecycle of an existing generation — retry a failed one, regenerate from scratch, cancel an in-progress job, or wait on its status.

```
voicebox-cli generate run <profile-id> <text> [options]
voicebox-cli generate retry <id>
voicebox-cli generate regenerate <id>
voicebox-cli generate cancel <id>
voicebox-cli generate status <id>

run options:
  -o, --output <path>    output file (.mp3 or .wav)   (default: outputs/generation.mp3)
  -l, --language <code>  language code                (default: en)
  --seed <n>             random seed
  --model-size <size>    model size (e.g. 1.7B)
  --instruct <text>      instruction / style prompt
  -e, --engine <engine>  TTS engine
  --personality          rewrite the text in-character before TTS
  --max-chunk-chars <n>  max characters per chunk for long text
  --crossfade-ms <n>     crossfade between chunks in ms
  --no-normalize         do not normalize output volume
  --base-url <url>       API base url
```

```bash
voicebox-cli generate run <profile-id> "A precise, reproducible take." --seed 42 -o outputs/take.wav
```

### `profiles`

Create, inspect, and delete the voice profiles that `speak` uses, and manage the reference samples a cloned voice is built from. A profile bundles a voice's language, engine defaults, and an optional personality prompt; samples are short audio clips plus their transcripts that teach the clone how the voice sounds. `update` merges your changes with the profile's current values, so you only pass the fields you want to change.

```
voicebox-cli profiles <subcommand> [options]

Subcommands:
  list                              list all profiles
  get <id>                          show a single profile (JSON)
  create <name> [options]           create a profile
  update <id> [options]             update a profile (merges with current values)
  delete <id>                       delete a profile
  presets <engine>                  list preset voices for an engine
  export <id> [-o <path>]           export a profile to a file (default: outputs/profile.zip)
  samples list <profile-id>         list a profile's reference samples
  samples add <profile-id> <file> <reference-text>   add a sample from an audio file
  samples update <sample-id> <reference-text>         change a sample's transcript
  samples delete <sample-id>        delete a sample
```

`create` / `update` options:

```
  -n, --name <name>            profile name (update only)
  -d, --description <text>     description
  -l, --language <code>        language code (default: en)
  --voice-type <type>          voice type (e.g. cloned)
  --preset-engine <engine>     preset engine
  --preset-voice-id <id>       preset voice id
  --design-prompt <text>       voice design prompt
  --default-engine <engine>    default TTS engine
  --personality <text>         in-character personality prompt
  --base-url <url>             API base url
```

```bash
# create a profile, then clone a voice into it from a reference clip
voicebox-cli profiles create "Narrator" --language en --personality "calm and warm"
voicebox-cli profiles samples add <profile-id> sample.wav "This is my reference voice."

# list profiles, then generate with one
voicebox-cli profiles list
voicebox-cli speak "Hello there" --profile Narrator -o outputs/hello.mp3
```

### `channels`

Manage audio output channels and the voices assigned to them. A channel is a named output route that binds a set of audio devices to a set of voice profiles, letting the server play different voices through different speakers. Use these subcommands to create channels, attach output devices, and control which profiles belong to each one.

```
voicebox-cli channels <subcommand> [options]

Subcommands:
  list                              list all channels
  get <id>                          show a single channel (JSON)
  create <name> [--device <id...>]  create a channel
  update <id> [-n <name>] [--device <id...>]   update a channel
  delete <id>                       delete a channel
  voices <id>                       list profiles assigned to a channel
  set-voices <id> <profile-ids...>  assign profiles to a channel
```

```bash
voicebox-cli channels create "Living room" --device dev-1 --device dev-2
voicebox-cli channels set-voices <channel-id> <profile-id-a> <profile-id-b>
```

### `history`

Browse and manage past generations. `list` supports filtering by profile and free-text search with pagination; `get` and `stats` inspect a single item or aggregate totals; `favorite`, `delete`, and `clear-failed` manage entries; and `export` / `export-audio` save a generation's archive or audio to disk.

```
voicebox-cli history list [-p <profile-id>] [-s <search>] [--limit <n>] [--offset <n>]
voicebox-cli history get <id>
voicebox-cli history stats
voicebox-cli history favorite <id>
voicebox-cli history delete <id>
voicebox-cli history clear-failed
voicebox-cli history export <id> [-o <path>]          # zip (default: outputs/<id>.zip)
voicebox-cli history export-audio <id> [-o <path>]    # wav (default: outputs/<id>.wav)
```

```bash
voicebox-cli history list --profile <profile-id> --search "hello" --limit 20
voicebox-cli history export-audio <id> -o outputs/take.wav
```

### `health`

Report the API's status: whether the model is loaded, which backend and GPU are in use, and any compatibility warnings. Pass `-f`/`--filesystem` to instead check that the server's storage directories exist, are writable, and have free disk space. Add `--json` to print the raw response for scripting.

```
voicebox-cli health [options]

Options:
  -f, --filesystem  check filesystem health instead
  --json            print the raw JSON response
  --base-url <url>  API base url
```

```bash
$ voicebox-cli health
status: healthy
model: loaded (1.7B)
gpu: MPS (Apple Silicon)
backend: mlx (cpu)
```

### `shutdown`

Gracefully shut down the API server. Because this stops the process that serves every other command, it refuses to run unless you pass `--yes` to confirm. Point it at a specific server with `--base-url`.

```
voicebox-cli shutdown [options]

Options:
  -y, --yes         skip the confirmation prompt
  --base-url <url>  API base url
```

```bash
voicebox-cli shutdown --yes
```

### `watchdog`

Control the server's parent-process watchdog. By default the server shuts itself down when the process that launched it goes away; `watchdog disable` turns that off so the server keeps running on its own. This is useful when you started the server from a short-lived launcher but want it to persist.

```
voicebox-cli watchdog disable [options]

Options:
  --base-url <url>  API base url
```

## Output formats

The API serves WAV; the CLI transcodes locally.

| Extension | Codec | Notes |
| --- | --- | --- |
| `.wav` | PCM | Uncompressed, universal |
| `.mp3` | libmp3lame | Small, widely supported |

For a royalty-free, WhatsApp/Chromium-friendly format, transcode to Opus with the bundled binary:

```bash
node_modules/ffmpeg-static/ffmpeg -i outputs/speech.mp3 -c:a libopus -b:a 96k outputs/speech.ogg
```

## Project layout

```
src/
  cli.ts                  # Commander entry point
  commands/
    speak_command.ts      # `speak` command
    generate_command.ts   # `generate` command group
    profiles_command.ts   # `profiles` command group
    channels_command.ts   # `channels` command group
    history_command.ts    # `history` command group
    health_command.ts     # `health` command
    shutdown_command.ts   # `shutdown` command
    watchdog_command.ts   # `watchdog` command
  misc/
    voicebox_client.ts    # VoiceboxClient — /speak, /profiles, status stream, audio download
    audio_convert.ts      # AudioConvert — WAV → MP3 via ffmpeg-static
examples/
  generate_speech.ts      # library usage without the CLI
outputs/                  # generated audio (git-ignored)
```

## Programmatic use

```ts
import { VoiceboxClient } from './src/misc/voicebox_client.js';

const client = new VoiceboxClient();
const generation = await client.speak({ text: 'Hello', profile: 'Test' });
const final = await client.waitForCompletion(generation.id);
const wav = await client.downloadAudio(final.id);
```

## Scripts

```bash
npm run cli        # run the CLI
npm run typecheck  # tsc against tsconfig.json
npm run build      # emit dist/ via tsconfig.build.json
```

## License

[MIT](LICENSE)
