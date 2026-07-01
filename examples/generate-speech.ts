import { writeFile } from 'node:fs/promises';
import { AudioConvert } from '../src/audio-convert.js';
import { VoiceboxClient } from '../src/voicebox-client.js';

async function main(): Promise<void> {
	const text = process.argv[2] ?? 'Hello from the voicebox client.';
	const profile = process.argv[3] ?? 'Test';
	const output = process.argv[4] ?? 'speech.mp3';

	const client = new VoiceboxClient();

	const generation = await client.speak({ text, profile });
	console.log(`queued generation ${generation.id} (status: ${generation.status})`);

	const final = await client.waitForCompletion(generation.id);
	if (final.status === 'failed') {
		throw new Error(`generation failed: ${final.error ?? 'unknown error'}`);
	}

	const wav = await client.downloadAudio(final.id);
	const audio = output.toLowerCase().endsWith('.mp3')
		? await AudioConvert.wavToMp3(wav)
		: wav;
	await writeFile(output, audio);

	console.log(`wrote ${audio.byteLength} bytes to ${output} (${final.duration}s)`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
