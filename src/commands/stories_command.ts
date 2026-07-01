import { writeFile } from 'node:fs/promises';
import type { Command } from 'commander';
import { VoiceboxClient } from '../misc/voicebox_client.js';
import type { StoryItemTime } from '../misc/voicebox_client.js';

/** Options shared by every stories subcommand. */
type GlobalOptions = {
	baseUrl?: string;
};

/** Options for the `create` and `update` subcommands. */
type CreateOptions = GlobalOptions & {
	description?: string;
};

/** Options for the `export-audio` subcommand. */
type ExportOptions = GlobalOptions & {
	output?: string;
};

/** Options for the `items add` subcommand. */
type ItemAddOptions = GlobalOptions & {
	startTimeMs?: number;
	track?: number;
};

/** Options for the `items move` subcommand. */
type ItemMoveOptions = GlobalOptions & {
	track?: number;
};

/** Parse a CLI string as an integer, throwing on non-numeric input. */
function toInt(value: string): number {
	const parsed = Number.parseInt(value, 10);
	if (Number.isNaN(parsed) === true) {
		throw new Error(`expected an integer, got '${value}'`);
	}
	return parsed;
}

/** Parse a CLI string as a float, throwing on non-numeric input. */
function toFloat(value: string): number {
	const parsed = Number.parseFloat(value);
	if (Number.isNaN(parsed) === true) {
		throw new Error(`expected a number, got '${value}'`);
	}
	return parsed;
}

/** Parse a `generationId:startTimeMs` pair into a timecode update. */
function toTimeUpdate(pair: string): StoryItemTime {
	const at = pair.lastIndexOf(':');
	if (at <= 0 || at === pair.length - 1) {
		throw new Error(`expected 'generationId:startTimeMs', got '${pair}'`);
	}
	return {
		generation_id: pair.slice(0, at),
		start_time_ms: toInt(pair.slice(at + 1)),
	};
}

/** Manage stories and the timeline items they are built from. */
export class StoriesCommand {
	/** Register the `stories` command group on the given Commander program. */
	static register(program: Command): void {
		const stories = program
			.command('stories')
			.description('Manage multi-clip stories and their timeline items');

		stories
			.command('list')
			.description('List all stories')
			.option('--base-url <url>', 'API base url')
			.action(async (options: GlobalOptions) => {
				await StoriesCommand.list(options);
			});

		stories
			.command('get')
			.description('Show a story and its items (JSON)')
			.argument('<id>', 'story id')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: GlobalOptions) => {
				await StoriesCommand.get(id, options);
			});

		stories
			.command('create')
			.description('Create a story')
			.argument('<name>', 'story name')
			.option('-d, --description <text>', 'description')
			.option('--base-url <url>', 'API base url')
			.action(async (name: string, options: CreateOptions) => {
				await StoriesCommand.create(name, options);
			});

		stories
			.command('update')
			.description('Update a story\'s name and description')
			.argument('<id>', 'story id')
			.argument('<name>', 'new story name')
			.option('-d, --description <text>', 'description')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, name: string, options: CreateOptions) => {
				await StoriesCommand.update(id, name, options);
			});

		stories
			.command('delete')
			.description('Delete a story')
			.argument('<id>', 'story id')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: GlobalOptions) => {
				await StoriesCommand.delete(id, options);
			});

		stories
			.command('export-audio')
			.description('Export a story as a single mixed audio file')
			.argument('<id>', 'story id')
			.option('-o, --output <path>', 'output file (default: outputs/<id>.wav)')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: ExportOptions) => {
				await StoriesCommand.exportAudio(id, options);
			});

		StoriesCommand.registerItems(stories);
	}

	/** Register the `stories items` subcommand group. */
	private static registerItems(stories: Command): void {
		const items = stories
			.command('items')
			.description('Manage a story\'s timeline items');

		items
			.command('add')
			.description('Add a generation to a story')
			.argument('<story-id>', 'story id')
			.argument('<generation-id>', 'generation id')
			.option('--start-time-ms <n>', 'start position in ms', toInt)
			.option('--track <n>', 'track index', toInt)
			.option('--base-url <url>', 'API base url')
			.action(async (storyId: string, generationId: string, options: ItemAddOptions) => {
				await StoriesCommand.itemsAdd(storyId, generationId, options);
			});

		items
			.command('remove')
			.description('Remove an item from a story')
			.argument('<story-id>', 'story id')
			.argument('<item-id>', 'item id')
			.option('--base-url <url>', 'API base url')
			.action(async (storyId: string, itemId: string, options: GlobalOptions) => {
				await StoriesCommand.itemsRemove(storyId, itemId, options);
			});

		items
			.command('times')
			.description('Batch-update item timecodes')
			.argument('<story-id>', 'story id')
			.argument('<updates...>', 'one or more generationId:startTimeMs pairs')
			.option('--base-url <url>', 'API base url')
			.action(async (storyId: string, updates: string[], options: GlobalOptions) => {
				await StoriesCommand.itemsTimes(storyId, updates, options);
			});

		items
			.command('reorder')
			.description('Reorder items by generation id')
			.argument('<story-id>', 'story id')
			.argument('<generation-ids...>', 'generation ids in the desired order')
			.option('--base-url <url>', 'API base url')
			.action(async (storyId: string, generationIds: string[], options: GlobalOptions) => {
				await StoriesCommand.itemsReorder(storyId, generationIds, options);
			});

		items
			.command('move')
			.description('Move an item to a new position and/or track')
			.argument('<story-id>', 'story id')
			.argument('<item-id>', 'item id')
			.argument('<start-time-ms>', 'new start position in ms', toInt)
			.option('--track <n>', 'track index', toInt)
			.option('--base-url <url>', 'API base url')
			.action(async (storyId: string, itemId: string, startTimeMs: number, options: ItemMoveOptions) => {
				await StoriesCommand.itemsMove(storyId, itemId, startTimeMs, options);
			});

		items
			.command('trim')
			.description('Trim an item\'s start and end')
			.argument('<story-id>', 'story id')
			.argument('<item-id>', 'item id')
			.argument('<trim-start-ms>', 'trim from the start in ms', toInt)
			.argument('<trim-end-ms>', 'trim from the end in ms', toInt)
			.option('--base-url <url>', 'API base url')
			.action(async (storyId: string, itemId: string, trimStartMs: number, trimEndMs: number, options: GlobalOptions) => {
				await StoriesCommand.itemsTrim(storyId, itemId, trimStartMs, trimEndMs, options);
			});

		items
			.command('volume')
			.description('Set an item\'s per-clip volume (0.0-2.0)')
			.argument('<story-id>', 'story id')
			.argument('<item-id>', 'item id')
			.argument('<volume>', 'linear gain (1.0 = original)', toFloat)
			.option('--base-url <url>', 'API base url')
			.action(async (storyId: string, itemId: string, volume: number, options: GlobalOptions) => {
				await StoriesCommand.itemsVolume(storyId, itemId, volume, options);
			});

		items
			.command('split')
			.description('Split an item at a given time into two clips')
			.argument('<story-id>', 'story id')
			.argument('<item-id>', 'item id')
			.argument('<split-time-ms>', 'split point in ms', toInt)
			.option('--base-url <url>', 'API base url')
			.action(async (storyId: string, itemId: string, splitTimeMs: number, options: GlobalOptions) => {
				await StoriesCommand.itemsSplit(storyId, itemId, splitTimeMs, options);
			});

		items
			.command('duplicate')
			.description('Duplicate an item')
			.argument('<story-id>', 'story id')
			.argument('<item-id>', 'item id')
			.option('--base-url <url>', 'API base url')
			.action(async (storyId: string, itemId: string, options: GlobalOptions) => {
				await StoriesCommand.itemsDuplicate(storyId, itemId, options);
			});

		items
			.command('version')
			.description('Pin an item to a generation version (omit to clear the pin)')
			.argument('<story-id>', 'story id')
			.argument('<item-id>', 'item id')
			.argument('[version-id]', 'version id to pin (omit to clear)')
			.option('--base-url <url>', 'API base url')
			.action(async (storyId: string, itemId: string, versionId: string | undefined, options: GlobalOptions) => {
				await StoriesCommand.itemsVersion(storyId, itemId, versionId, options);
			});
	}

	/** Print one line per story plus a count footer (`GET /stories`). */
	static async list(options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const stories = await client.listStories();
		for (const story of stories) {
			console.log(`${story.id}  ${story.name}  (${story.item_count} items)`);
		}
		console.log(`${stories.length} stories`);
	}

	/** Print a story and its items as pretty JSON (`GET /stories/{id}`). */
	static async get(id: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		console.log(JSON.stringify(await client.getStory(id), null, 2));
	}

	/** Create a story (`POST /stories`). */
	static async create(name: string, options: CreateOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const story = await client.createStory({ name, description: options.description });
		console.log(`created story ${story.id}`);
	}

	/** Update a story's name and description (`PUT /stories/{id}`). */
	static async update(id: string, name: string, options: CreateOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const story = await client.updateStory(id, { name, description: options.description });
		console.log(`updated story ${story.id}`);
	}

	/** Delete a story (`DELETE /stories/{id}`). */
	static async delete(id: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		await client.deleteStory(id);
		console.log(`deleted ${id}`);
	}

	/**
	 * Download a story's mixed audio and write it to `options.output`
	 * (default `outputs/<id>.wav`) (`GET /stories/{id}/export-audio`).
	 */
	static async exportAudio(id: string, options: ExportOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const output = options.output ?? `outputs/${id}.wav`;
		const bytes = await client.exportStoryAudio(id);
		await writeFile(output, bytes);
		console.log(`wrote ${bytes.byteLength} bytes to ${output}`);
	}

	/** Add a generation to a story (`POST /stories/{id}/items`). */
	static async itemsAdd(storyId: string, generationId: string, options: ItemAddOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const item = await client.addStoryItem(storyId, {
			generation_id: generationId,
			start_time_ms: options.startTimeMs,
			track: options.track,
		});
		console.log(`added item ${item.id} to story ${storyId}`);
	}

	/** Remove an item from a story (`DELETE /stories/{id}/items/{item_id}`). */
	static async itemsRemove(storyId: string, itemId: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		await client.removeStoryItem(storyId, itemId);
		console.log(`removed item ${itemId} from story ${storyId}`);
	}

	/** Batch-update item timecodes (`PUT /stories/{id}/items/times`). */
	static async itemsTimes(storyId: string, updates: string[], options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		await client.updateStoryItemTimes(storyId, updates.map(toTimeUpdate));
		console.log(`updated ${updates.length} timecodes in story ${storyId}`);
	}

	/** Reorder items by generation id (`PUT /stories/{id}/items/reorder`). */
	static async itemsReorder(storyId: string, generationIds: string[], options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const items = await client.reorderStoryItems(storyId, generationIds);
		console.log(`reordered ${items.length} items in story ${storyId}`);
	}

	/** Move an item to a new position and/or track (`PUT /stories/{id}/items/{item_id}/move`). */
	static async itemsMove(storyId: string, itemId: string, startTimeMs: number, options: ItemMoveOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const item = await client.moveStoryItem(storyId, itemId, startTimeMs, options.track);
		console.log(`moved item ${item.id} to ${item.start_time_ms}ms (track ${item.track})`);
	}

	/** Trim an item's start/end (`PUT /stories/{id}/items/{item_id}/trim`). */
	static async itemsTrim(storyId: string, itemId: string, trimStartMs: number, trimEndMs: number, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const item = await client.trimStoryItem(storyId, itemId, trimStartMs, trimEndMs);
		console.log(`trimmed item ${item.id} (start ${item.trim_start_ms}ms, end ${item.trim_end_ms}ms)`);
	}

	/** Set an item's per-clip volume (`PUT /stories/{id}/items/{item_id}/volume`). */
	static async itemsVolume(storyId: string, itemId: string, volume: number, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const item = await client.setStoryItemVolume(storyId, itemId, volume);
		console.log(`set item ${item.id} volume to ${item.volume}`);
	}

	/** Split an item into two clips (`POST /stories/{id}/items/{item_id}/split`). */
	static async itemsSplit(storyId: string, itemId: string, splitTimeMs: number, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const items = await client.splitStoryItem(storyId, itemId, splitTimeMs);
		console.log(`split into ${items.length} items: ${items.map((item) => item.id).join(', ')}`);
	}

	/** Duplicate an item (`POST /stories/{id}/items/{item_id}/duplicate`). */
	static async itemsDuplicate(storyId: string, itemId: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const item = await client.duplicateStoryItem(storyId, itemId);
		console.log(`duplicated item ${itemId} as ${item.id}`);
	}

	/** Pin (or clear) an item's generation version (`PUT /stories/{id}/items/{item_id}/version`). */
	static async itemsVersion(storyId: string, itemId: string, versionId: string | undefined, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const item = await client.setStoryItemVersion(storyId, itemId, versionId);
		const pin = item.version_id === null ? 'cleared version pin' : `pinned version ${item.version_id}`;
		console.log(`${pin} on item ${item.id}`);
	}
}
