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

### `health`

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

Gracefully shuts down the API server. Requires `--yes` to confirm, since it stops the running server.

```
voicebox-cli shutdown [options]

Options:
  -y, --yes         skip the confirmation prompt
  --base-url <url>  API base url
```

```bash
voicebox-cli shutdown --yes
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
    profiles_command.ts   # `profiles` command group
    health_command.ts     # `health` command
    shutdown_command.ts   # `shutdown` command
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
