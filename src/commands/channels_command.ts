import type { Command } from 'commander';
import type { AudioChannelInput } from '../misc/voicebox_client.js';
import { VoiceboxClient } from '../misc/voicebox_client.js';

/** Options shared by every `channels` subcommand. */
type GlobalOptions = {
	baseUrl?: string;
};

/** Options for `channels create`. */
type CreateOptions = GlobalOptions & {
	device?: string[];
};

/** Options for `channels update`. */
type UpdateOptions = GlobalOptions & {
	name?: string;
	device?: string[];
};

/** CLI for managing audio output channels that route voices to devices. */
export class ChannelsCommand {
	/** Register the `channels` command group on the given Commander program. */
	static register(program: Command): void {
		const channels = program
			.command('channels')
			.description('Manage audio output channels');

		channels
			.command('list')
			.description('List all channels')
			.option('--base-url <url>', 'API base url')
			.action(async (options: GlobalOptions) => {
				await ChannelsCommand.list(options);
			});

		channels
			.command('get')
			.description('Show a single channel')
			.argument('<id>', 'channel id')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: GlobalOptions) => {
				await ChannelsCommand.get(id, options);
			});

		channels
			.command('create')
			.description('Create a channel')
			.argument('<name>', 'channel name')
			.option('--device <id...>', 'output device id (repeatable)')
			.option('--base-url <url>', 'API base url')
			.action(async (name: string, options: CreateOptions) => {
				await ChannelsCommand.create(name, options);
			});

		channels
			.command('update')
			.description('Update a channel')
			.argument('<id>', 'channel id')
			.option('-n, --name <name>', 'channel name')
			.option('--device <id...>', 'output device id (repeatable, replaces the set)')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: UpdateOptions) => {
				await ChannelsCommand.update(id, options);
			});

		channels
			.command('delete')
			.description('Delete a channel')
			.argument('<id>', 'channel id')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: GlobalOptions) => {
				await ChannelsCommand.delete(id, options);
			});

		channels
			.command('voices')
			.description('List the voice profiles assigned to a channel')
			.argument('<id>', 'channel id')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: GlobalOptions) => {
				await ChannelsCommand.voices(id, options);
			});

		channels
			.command('set-voices')
			.description('Set the voice profiles assigned to a channel')
			.argument('<id>', 'channel id')
			.argument('<profile-ids...>', 'profile ids to assign')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, profileIds: string[], options: GlobalOptions) => {
				await ChannelsCommand.setVoices(id, profileIds, options);
			});
	}

	/** List all channels with a summary of each (`GET /channels`). */
	static async list(options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const channels = await client.listChannels();
		for (const channel of channels) {
			const flags = `${channel.is_default === true ? 'default, ' : ''}${channel.device_ids.length} devices`;
			console.log(`${channel.id}  ${channel.name}  (${flags})`);
		}
	}

	/** Print a single channel as JSON (`GET /channels/{id}`). */
	static async get(id: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		console.log(JSON.stringify(await client.getChannel(id), null, 2));
	}

	/** Create a channel with the given name and output devices (`POST /channels`). */
	static async create(name: string, options: CreateOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const channel = await client.createChannel(name, options.device ?? []);
		console.log(`created channel ${channel.id} (${channel.name})`);
	}

	/** Update a channel's name and/or device set (`PUT /channels/{id}`). */
	static async update(id: string, options: UpdateOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const input: AudioChannelInput = {
			name: options.name,
			device_ids: options.device,
		};
		const channel = await client.updateChannel(id, input);
		console.log(`updated channel ${channel.id} (${channel.name})`);
	}

	/** Delete a channel (`DELETE /channels/{id}`). */
	static async delete(id: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		await client.deleteChannel(id);
		console.log(`deleted channel ${id}`);
	}

	/** Print the voice profiles assigned to a channel as JSON (`GET /channels/{id}/voices`). */
	static async voices(id: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		console.log(JSON.stringify(await client.getChannelVoices(id), null, 2));
	}

	/** Replace the set of voice profiles assigned to a channel (`PUT /channels/{id}/voices`). */
	static async setVoices(id: string, profileIds: string[], options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		await client.setChannelVoices(id, profileIds);
		console.log(`assigned ${profileIds.length} profiles to channel ${id}`);
	}
}
