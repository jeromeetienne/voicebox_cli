import { writeFile } from 'node:fs/promises';
import type { Command } from 'commander';
import { AudioConvert } from '../misc/audio-convert.js';
import type { SpeakEngine, SpeakLanguage } from '../misc/voicebox-client.js';
import { VoiceboxClient } from '../misc/voicebox-client.js';

export type SpeakOptions = {
	profile?: string;
	output: string;
	engine?: SpeakEngine;
	language?: SpeakLanguage;
	personality?: boolean;
	baseUrl?: string;
};

export class Speak {
	static register(program: Command): void {
		program
			.command('speak')
			.description('Generate speech from text and save it as audio')
			.argument('<text>', 'text to synthesize')
			.option('-p, --profile <profile>', 'voice profile name or id')
			.option('-o, --output <path>', 'output file (.mp3 or .wav)', 'speech.mp3')
			.option('-e, --engine <engine>', 'TTS engine')
			.option('-l, --language <language>', 'language code (e.g. en, fr, ja)')
			.option('--personality', 'rewrite the text in-character before TTS')
			.option('--base-url <url>', 'API base url')
			.action(async (text: string, options: SpeakOptions) => {
				await Speak.run(text, options);
			});
	}

	static async run(text: string, options: SpeakOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);

		const generation = await client.speak({
			text,
			profile: options.profile,
			engine: options.engine,
			language: options.language,
			personality: options.personality,
		});
		console.log(`queued generation ${generation.id} (status: ${generation.status})`);

		const final = await client.waitForCompletion(generation.id);
		if (final.status === 'failed') {
			throw new Error(`generation failed: ${final.error ?? 'unknown error'}`);
		}

		const wav = await client.downloadAudio(final.id);
		const audio = options.output.toLowerCase().endsWith('.mp3')
			? await AudioConvert.wavToMp3(wav)
			: wav;
		await writeFile(options.output, audio);

		console.log(`wrote ${audio.byteLength} bytes to ${options.output} (${final.duration}s)`);
	}
}
