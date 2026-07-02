# Data models

The request and response shapes exchanged with the voicebox API, as declared in
[src/misc/voicebox_client.ts](../../src/misc/voicebox_client.ts). These are the
TypeScript mirrors of the API's JSON; the authoritative schema is the
[API reference](../api_reference/index.md).

- [voice_profile](./voice_profile.md) — a voice and its reference samples.
- [generation](./generation.md) — speak/generate requests, the generation
  record, status events, and history items.
- [story](./story.md) — a multi-clip timeline and its items.
- [audio_channel](./audio_channel.md) — an output channel routing voices to
  devices.
- [model_status](./model_status.md) — the state of a downloadable model.
- [server_health](./server_health.md) — server, GPU, and filesystem health.
- [engines_and_languages](./engines_and_languages.md) — the accepted engine,
  language, and transcription-model value sets.
