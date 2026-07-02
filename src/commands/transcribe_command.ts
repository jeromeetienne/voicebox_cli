import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import type { Command } from 'commander';
import { AudioConvert } from '../misc/audio_convert.js';
import { EnumOption } from '../misc/enum-option.js';
import { SPEAK_LANGUAGES, TRANSCRIBE_MODELS, VoiceboxClient } from '../misc/voicebox_client.js';

/** Options accepted by the `transcribe` command. */
export type TranscribeOptions = {
	language?: string;
	model?: string;
	json?: boolean;
	baseUrl?: string;
};

/** Transcribe an audio file to text. */
export class TranscribeCommand {
	/** Register the `transcribe` command on the given Commander program. */
	static register(program: Command): void {
		program
			.command('transcribe')
			.description('Transcribe an audio file to text')
			.argument('<file>', 'audio file path')
			.addOption(EnumOption.create('-l, --language <language>', 'language hint', SPEAK_LANGUAGES))
			.addOption(EnumOption.create('-m, --model <model>', 'transcription model', TRANSCRIBE_MODELS))
			.option('--json', 'print the raw JSON response')
			.option('--base-url <url>', 'API base url')
			.action(async (file: string, options: TranscribeOptions) => {
				await TranscribeCommand.run(file, options);
			});
	}

	/**
	 * Read the audio file, upload it for transcription, and print the
	 * transcript (or the raw JSON with `--json`) (`POST /transcribe`).
	 *
	 * Inputs that are not already WAV are transcoded to WAV via ffmpeg before
	 * upload, so MP3 and any other ffmpeg-readable format is accepted.
	 */
	static async run(file: string, options: TranscribeOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const raw = new Uint8Array(await readFile(file));

		const isWav = extname(file).toLowerCase() === '.wav';
		const data = isWav === true ? raw : await AudioConvert.toWav(raw);
		const filename = isWav === true
			? basename(file)
			: `${basename(file, extname(file))}.wav`;

		const model = options.model === undefined
			? undefined
			: options.model.replace(/^whisper-/, '');

		const result = await client.transcribe(
			{ data, filename },
			{ language: options.language, model },
		);

		if (options.json === true) {
			console.log(JSON.stringify(result, null, 2));
			return;
		}
		if (result.text === undefined || result.text === null) {
			throw new Error(
				'transcription returned no text (the model may still be loading — retry in a moment)',
			);
		}
		console.log(result.text);
	}
}
