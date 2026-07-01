import type { Command } from 'commander';
import { VoiceboxClient } from '../misc/voicebox_client.js';

/** Options shared by every models subcommand. */
type GlobalOptions = {
	baseUrl?: string;
};

/** Manage TTS models: status, load/unload, download, and migration. */
export class ModelsCommand {
	/** Register the `models` command group on the given Commander program. */
	static register(program: Command): void {
		const models = program
			.command('models')
			.description('Manage TTS models: status, load/unload, download, migration');

		models
			.command('status')
			.description('Show the status of all available models')
			.option('--base-url <url>', 'API base url')
			.action(async (options: GlobalOptions) => {
				await ModelsCommand.status(options);
			});

		models
			.command('load')
			.description('Load the default TTS model into memory')
			.argument('[size]', 'model size to load (default: server default)')
			.option('--base-url <url>', 'API base url')
			.action(async (size: string | undefined, options: GlobalOptions) => {
				await ModelsCommand.load(size, options);
			});

		models
			.command('unload')
			.description('Unload a model from memory (the default model if no name is given)')
			.argument('[name]', 'model name to unload')
			.option('--base-url <url>', 'API base url')
			.action(async (name: string | undefined, options: GlobalOptions) => {
				await ModelsCommand.unload(name, options);
			});

		models
			.command('download')
			.description('Trigger download of a specific model')
			.argument('<name>', 'model name')
			.option('--base-url <url>', 'API base url')
			.action(async (name: string, options: GlobalOptions) => {
				await ModelsCommand.download(name, options);
			});

		models
			.command('cancel-download')
			.description('Cancel or dismiss an errored/stale download task')
			.argument('<name>', 'model name')
			.option('--base-url <url>', 'API base url')
			.action(async (name: string, options: GlobalOptions) => {
				await ModelsCommand.cancelDownload(name, options);
			});

		models
			.command('delete')
			.description('Delete a downloaded model from the cache')
			.argument('<name>', 'model name')
			.option('--base-url <url>', 'API base url')
			.action(async (name: string, options: GlobalOptions) => {
				await ModelsCommand.delete(name, options);
			});

		models
			.command('cache-dir')
			.description('Show the model cache directory')
			.option('--base-url <url>', 'API base url')
			.action(async (options: GlobalOptions) => {
				await ModelsCommand.cacheDir(options);
			});

		models
			.command('progress')
			.description('Stream download progress for a model')
			.argument('<name>', 'model name')
			.option('--base-url <url>', 'API base url')
			.action(async (name: string, options: GlobalOptions) => {
				await ModelsCommand.progress(name, options);
			});

		models
			.command('migrate')
			.description('Move all downloaded models to a new directory (streams progress)')
			.argument('<destination>', 'destination directory')
			.option('--base-url <url>', 'API base url')
			.action(async (destination: string, options: GlobalOptions) => {
				await ModelsCommand.migrate(destination, options);
			});

		models
			.command('migrate-progress')
			.description('Stream the progress of an in-flight model migration')
			.option('--base-url <url>', 'API base url')
			.action(async (options: GlobalOptions) => {
				await ModelsCommand.migrateProgress(options);
			});
	}

	/** Print one line per model with download/loaded state (`GET /models/status`). */
	static async status(options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const { models } = await client.modelStatus();
		for (const model of models) {
			const downloaded = model.downloaded === true ? '✓' : ' ';
			const state = model.loaded === true
				? 'loaded'
				: model.downloading === true
					? 'downloading'
					: '';
			const size = model.size_mb === null || model.size_mb === undefined
				? ''
				: `${model.size_mb} MB`;
			console.log(`${downloaded} ${model.model_name}  ${model.display_name}  ${size}  ${state}`.trimEnd());
		}
		console.log(`${models.length} models`);
	}

	/** Load the default TTS model, optionally at a given size (`POST /models/load`). */
	static async load(size: string | undefined, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		console.log(JSON.stringify(await client.loadModel(size), null, 2));
	}

	/**
	 * Unload a model (`POST /models/unload` or `POST /models/{name}/unload`).
	 *
	 * With no name the default model is unloaded; with a name that specific
	 * model is unloaded from memory.
	 */
	static async unload(name: string | undefined, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const result = name === undefined
			? await client.unloadModel()
			: await client.unloadModelByName(name);
		console.log(JSON.stringify(result, null, 2));
	}

	/** Trigger a model download (`POST /models/download`). */
	static async download(name: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		console.log(JSON.stringify(await client.downloadModel(name), null, 2));
	}

	/** Cancel a stale/errored download task (`POST /models/download/cancel`). */
	static async cancelDownload(name: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		console.log(JSON.stringify(await client.cancelModelDownload(name), null, 2));
	}

	/** Delete a downloaded model (`DELETE /models/{name}`). */
	static async delete(name: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		console.log(JSON.stringify(await client.deleteModel(name), null, 2));
	}

	/** Print the model cache directory (`GET /models/cache-dir`). */
	static async cacheDir(options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		console.log(JSON.stringify(await client.modelsCacheDir(), null, 2));
	}

	/** Stream and print download progress events (`GET /models/progress/{name}`). */
	static async progress(name: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		for await (const event of client.streamModelProgress(name)) {
			console.log(JSON.stringify(event));
		}
	}

	/** Migrate models to a new directory, printing progress events (`POST /models/migrate`). */
	static async migrate(destination: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		for await (const event of client.migrateModels(destination)) {
			console.log(JSON.stringify(event));
		}
	}

	/** Stream and print migration progress events (`GET /models/migrate/progress`). */
	static async migrateProgress(options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		for await (const event of client.streamMigrationProgress()) {
			console.log(JSON.stringify(event));
		}
	}
}
