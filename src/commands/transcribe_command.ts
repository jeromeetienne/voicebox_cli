import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { Command } from 'commander';
import { VoiceboxClient } from '../misc/voicebox_client.js';

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
			.option('-l, --language <language>', 'language hint (e.g. en, fr, ja)')
			.option('-m, --model <model>', 'transcription model')
			.option('--json', 'print the raw JSON response')
			.option('--base-url <url>', 'API base url')
			.action(async (file: string, options: TranscribeOptions) => {
				await TranscribeCommand.run(file, options);
			});
	}

	/**
	 * Read the audio file, upload it for transcription, and print the
	 * transcript (or the raw JSON with `--json`) (`POST /transcribe`).
	 */
	static async run(file: string, options: TranscribeOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const data = await readFile(file);
		const result = await client.transcribe(
			{ data, filename: basename(file) },
			{ language: options.language, model: options.model },
		);

		if (options.json === true) {
			console.log(JSON.stringify(result, null, 2));
			return;
		}
		console.log(result.text);
	}
}
