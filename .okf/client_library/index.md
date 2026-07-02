# Client library

The reusable pieces behind the CLI. `voicebox-cli` publishes
[VoiceboxClient](./voicebox_client.md) as its library entry point (the package
`main`/`exports` point at the compiled `voicebox_client.js`), so the same client
the commands use can be imported directly — see the
[examples](../examples/index.md).

- [voicebox_client](./voicebox_client.md) — thin, fully-typed HTTP client for the
  voicebox API; one method per endpoint.
- [audio_convert](./audio_convert.md) — WAV↔MP3/other transcoding via the bundled
  `ffmpeg-static` binary.
- [enum_option](./enum_option.md) — Commander option helper that restricts a
  value to a fixed set.
