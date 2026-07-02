import { writeFile } from 'node:fs/promises';
import type { Command } from 'commander';
import { VoiceboxClient } from '../misc/voicebox_client.js';

/** Options shared by every history subcommand. */
type GlobalOptions = {
	baseUrl?: string;
};

/** Options for the `list` subcommand: filters and pagination. */
type ListOptions = GlobalOptions & {
	profile?: string;
	search?: string;
	limit?: number;
	offset?: number;
};

/** Options for the `export` and `export-audio` subcommands. */
type ExportOptions = GlobalOptions & {
	output?: string;
};

/** Parse a CLI string as an integer, throwing on non-numeric input. */
function toInt(value: string): number {
	const parsed = Number.parseInt(value, 10);
	if (Number.isNaN(parsed) === true) {
		throw new Error(`expected an integer, got '${value}'`);
	}
	return parsed;
}

/** Browse and manage generation history. */
export class HistoryCommand {
	/** Register the `history` command group on the given Commander program. */
	static register(program: Command): void {
		const history = program
			.command('history')
			.description('Browse and manage generation history');

		history
			.command('list')
			.description('List past generations')
			.option('-p, --profile <id>', 'filter by profile id')
			.option('-s, --search <text>', 'search text')
			.option('--limit <n>', 'max items to return', toInt)
			.option('--offset <n>', 'pagination offset', toInt)
			.option('--base-url <url>', 'API base url')
			.action(async (options: ListOptions) => {
				await HistoryCommand.list(options);
			});

		history
			.command('get')
			.description('Show a single generation (JSON)')
			.argument('<id>', 'generation id')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: GlobalOptions) => {
				await HistoryCommand.get(id, options);
			});

		history
			.command('stats')
			.description('Show aggregate generation statistics')
			.option('--base-url <url>', 'API base url')
			.action(async (options: GlobalOptions) => {
				await HistoryCommand.stats(options);
			});

		history
			.command('favorite')
			.description('Toggle the favorite flag on a generation')
			.argument('<id>', 'generation id')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: GlobalOptions) => {
				await HistoryCommand.favorite(id, options);
			});

		history
			.command('delete')
			.description('Delete a generation')
			.argument('<id>', 'generation id')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: GlobalOptions) => {
				await HistoryCommand.delete(id, options);
			});

		history
			.command('clear-failed')
			.description('Delete all failed generations')
			.option('--base-url <url>', 'API base url')
			.action(async (options: GlobalOptions) => {
				await HistoryCommand.clearFailed(options);
			});

		history
			.command('export')
			.description('Export a generation to a zip archive')
			.argument('<id>', 'generation id')
			.option('-o, --output <path>', 'output file (default: outputs/<id>.zip)')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: ExportOptions) => {
				await HistoryCommand.export(id, options);
			});

		history
			.command('export-audio')
			.description('Export a generation\'s audio to a file')
			.argument('<id>', 'generation id')
			.option('-o, --output <path>', 'output file (default: outputs/<id>.wav)')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: ExportOptions) => {
				await HistoryCommand.exportAudio(id, options);
			});
	}

	/** Print one line per generation plus a shown/total footer (`GET /history`). */
	static async list(options: ListOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const history = await client.listHistory({
			profileId: options.profile,
			search: options.search,
			limit: options.limit,
			offset: options.offset,
		});
		for (const item of history.items) {
			const star = item.is_favorited === true ? '★' : ' ';
			const text = item.text.length > 60 ? `${item.text.slice(0, 57)}...` : item.text;
			console.log(`${star} ${item.id}  ${item.profile_name}  ${item.status}  "${text}"`);
		}
		console.log(`${history.items.length} shown / ${history.total} total`);
	}

	/** Print a single generation as pretty JSON (`GET /history/{id}`). */
	static async get(id: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		console.log(JSON.stringify(await client.getHistory(id), null, 2));
	}

	/** Print aggregate generation statistics as JSON (`GET /history/stats`). */
	static async stats(options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const [stats, profiles] = await Promise.all([
			client.historyStats(),
			client.listProfiles(),
		]);
		const nameById = new Map(profiles.map((profile) => [profile.id, profile.name]));
		const raw = stats as { generations_by_profile?: Record<string, number> };
		if (raw.generations_by_profile !== undefined) {
			const byName: Record<string, number> = {};
			for (const [profileId, count] of Object.entries(raw.generations_by_profile)) {
				byName[nameById.get(profileId) ?? profileId] = count;
			}
			raw.generations_by_profile = byName;
		}
		console.log(JSON.stringify(raw, null, 2));
	}

	/** Toggle a generation's favorite flag (`POST /history/{id}/favorite`). */
	static async favorite(id: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		await client.toggleFavorite(id);
		console.log(`toggled favorite for ${id}`);
	}

	/** Delete a generation (`DELETE /history/{id}`). */
	static async delete(id: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		await client.deleteHistory(id);
		console.log(`deleted ${id}`);
	}

	/** Delete all failed generations (`DELETE /history/failed`). */
	static async clearFailed(options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		await client.clearFailedHistory();
		console.log('cleared failed generations');
	}

	/**
	 * Download a generation's zip export and write it to
	 * `options.output` (default `outputs/<id>.zip`) (`GET /history/{id}/export`).
	 */
	static async export(id: string, options: ExportOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const output = options.output ?? `outputs/${id}.zip`;
		const bytes = await client.exportHistory(id);
		await writeFile(output, bytes);
		console.log(`wrote ${bytes.byteLength} bytes to ${output}`);
	}

	/**
	 * Download a generation's audio and write it to `options.output`
	 * (default `outputs/<id>.wav`) (`GET /history/{id}/export-audio`).
	 */
	static async exportAudio(id: string, options: ExportOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const output = options.output ?? `outputs/${id}.wav`;
		const bytes = await client.exportHistoryAudio(id);
		await writeFile(output, bytes);
		console.log(`wrote ${bytes.byteLength} bytes to ${output}`);
	}
}
