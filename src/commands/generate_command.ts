import { writeFile } from 'node:fs/promises';
import type { Command } from 'commander';
import { AudioConvert } from '../misc/audio_convert.js';
import { VoiceboxClient } from '../misc/voicebox_client.js';

/** Options shared by every `generate` subcommand. */
type GlobalOptions = {
	baseUrl?: string;
};

/** Options for `generate run`. */
type RunOptions = GlobalOptions & {
	output: string;
	language?: string;
	seed?: number;
	modelSize?: string;
	instruct?: string;
	engine?: string;
	personality?: boolean;
	maxChunkChars?: number;
	crossfadeMs?: number;
	normalize?: boolean;
};

/** Parse a CLI string as a base-10 integer, throwing on non-numeric input. */
function toInt(value: string): number {
	const parsed = Number.parseInt(value, 10);
	if (Number.isNaN(parsed) === true) {
		throw new Error(`expected an integer, got '${value}'`);
	}
	return parsed;
}

/** CLI for low-level speech generation with full control over the request. */
export class GenerateCommand {
	/** Register the `generate` command group on the given Commander program. */
	static register(program: Command): void {
		const generate = program
			.command('generate')
			.description('Low-level speech generation (full control over the request)');

		generate
			.command('run')
			.description('Generate speech for a profile and save the audio')
			.argument('<profile-id>', 'voice profile id')
			.argument('<text>', 'text to synthesize')
			.option('-o, --output <path>', 'output file (.mp3 or .wav)', 'outputs/generation.mp3')
			.option('-l, --language <code>', 'language code', 'en')
			.option('--seed <n>', 'random seed', toInt)
			.option('--model-size <size>', 'model size (e.g. 1.7B)')
			.option('--instruct <text>', 'instruction / style prompt')
			.option('-e, --engine <engine>', 'TTS engine')
			.option('--personality', 'rewrite the text in-character before TTS')
			.option('--max-chunk-chars <n>', 'max characters per chunk for long text', toInt)
			.option('--crossfade-ms <n>', 'crossfade between chunks in ms', toInt)
			.option('--no-normalize', 'do not normalize output volume')
			.option('--base-url <url>', 'API base url')
			.action(async (profileId: string, text: string, options: RunOptions) => {
				await GenerateCommand.run(profileId, text, options);
			});

		generate
			.command('retry')
			.description('Retry a failed generation')
			.argument('<id>', 'generation id')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: GlobalOptions) => {
				await GenerateCommand.retry(id, options);
			});

		generate
			.command('regenerate')
			.description('Regenerate a generation from scratch')
			.argument('<id>', 'generation id')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: GlobalOptions) => {
				await GenerateCommand.regenerate(id, options);
			});

		generate
			.command('cancel')
			.description('Cancel an in-progress generation')
			.argument('<id>', 'generation id')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: GlobalOptions) => {
				await GenerateCommand.cancel(id, options);
			});

		generate
			.command('status')
			.description('Wait for a generation to finish and report its status')
			.argument('<id>', 'generation id')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: GlobalOptions) => {
				await GenerateCommand.status(id, options);
			});
	}

	/**
	 * Generate speech (`POST /generate`), wait for completion, then save the
	 * audio to `options.output` (transcoding to MP3 when the path ends in `.mp3`).
	 *
	 * @param text Text to synthesize.
	 */
	static async run(profileId: string, text: string, options: RunOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);

		const generation = await client.generate({
			profile_id: profileId,
			text,
			language: options.language,
			seed: options.seed,
			model_size: options.modelSize,
			instruct: options.instruct,
			engine: options.engine,
			personality: options.personality,
			max_chunk_chars: options.maxChunkChars,
			crossfade_ms: options.crossfadeMs,
			normalize: options.normalize,
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

	/** Retry a failed generation (`POST /generate/{id}/retry`). */
	static async retry(id: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const generation = await client.retryGeneration(id);
		console.log(`retry queued ${generation.id} (status: ${generation.status})`);
	}

	/** Regenerate a generation from scratch (`POST /generate/{id}/regenerate`). */
	static async regenerate(id: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const generation = await client.regenerateGeneration(id);
		console.log(`regenerate queued ${generation.id} (status: ${generation.status})`);
	}

	/** Cancel an in-progress generation (`POST /generate/{id}/cancel`). */
	static async cancel(id: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		await client.cancelGeneration(id);
		console.log(`cancelled ${id}`);
	}

	/** Wait for a generation to finish and print its terminal status (`GET /generate/{id}/status`). */
	static async status(id: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const status = await client.waitForCompletion(id);
		console.log(`${status.id}: ${status.status}${status.error !== null ? ` — ${status.error}` : ''} (${status.duration}s)`);
	}
}
