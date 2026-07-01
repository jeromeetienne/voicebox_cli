import { readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { Command } from 'commander';
import type { VoiceProfileInput } from '../misc/voicebox-client.js';
import { VoiceboxClient } from '../misc/voicebox-client.js';

type GlobalOptions = {
	baseUrl?: string;
};

type CreateOptions = GlobalOptions & {
	description?: string;
	language?: string;
	voiceType?: string;
	presetEngine?: string;
	presetVoiceId?: string;
	designPrompt?: string;
	defaultEngine?: string;
	personality?: string;
};

export class ProfilesCommand {
	static register(program: Command): void {
		const profiles = program
			.command('profiles')
			.description('Manage voice profiles');

		profiles
			.command('list')
			.description('List all voice profiles')
			.option('--base-url <url>', 'API base url')
			.action(async (options: GlobalOptions) => {
				await ProfilesCommand.list(options);
			});

		profiles
			.command('get')
			.description('Show a single voice profile')
			.argument('<id>', 'profile id')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: GlobalOptions) => {
				await ProfilesCommand.get(id, options);
			});

		profiles
			.command('create')
			.description('Create a voice profile')
			.argument('<name>', 'profile name')
			.option('-d, --description <text>', 'description')
			.option('-l, --language <code>', 'language code', 'en')
			.option('--voice-type <type>', 'voice type (e.g. cloned)')
			.option('--preset-engine <engine>', 'preset engine')
			.option('--preset-voice-id <id>', 'preset voice id')
			.option('--design-prompt <text>', 'voice design prompt')
			.option('--default-engine <engine>', 'default TTS engine')
			.option('--personality <text>', 'in-character personality prompt')
			.option('--base-url <url>', 'API base url')
			.action(async (name: string, options: CreateOptions) => {
				await ProfilesCommand.create(name, options);
			});

		profiles
			.command('update')
			.description('Update a voice profile')
			.argument('<id>', 'profile id')
			.option('-n, --name <name>', 'profile name')
			.option('-d, --description <text>', 'description')
			.option('-l, --language <code>', 'language code')
			.option('--voice-type <type>', 'voice type')
			.option('--preset-engine <engine>', 'preset engine')
			.option('--preset-voice-id <id>', 'preset voice id')
			.option('--design-prompt <text>', 'voice design prompt')
			.option('--default-engine <engine>', 'default TTS engine')
			.option('--personality <text>', 'in-character personality prompt')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: CreateOptions & { name?: string }) => {
				await ProfilesCommand.update(id, options);
			});

		profiles
			.command('delete')
			.description('Delete a voice profile')
			.argument('<id>', 'profile id')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: GlobalOptions) => {
				await ProfilesCommand.delete(id, options);
			});

		profiles
			.command('presets')
			.description('List preset voices for an engine')
			.argument('<engine>', 'engine name (e.g. qwen, kokoro)')
			.option('--base-url <url>', 'API base url')
			.action(async (engine: string, options: GlobalOptions) => {
				await ProfilesCommand.presets(engine, options);
			});

		profiles
			.command('export')
			.description('Export a profile to a file')
			.argument('<id>', 'profile id')
			.option('-o, --output <path>', 'output file', 'outputs/profile.zip')
			.option('--base-url <url>', 'API base url')
			.action(async (id: string, options: GlobalOptions & { output: string }) => {
				await ProfilesCommand.export(id, options);
			});

		const samples = profiles
			.command('samples')
			.description('Manage a profile\'s reference samples');

		samples
			.command('list')
			.description('List samples for a profile')
			.argument('<profile-id>', 'profile id')
			.option('--base-url <url>', 'API base url')
			.action(async (profileId: string, options: GlobalOptions) => {
				await ProfilesCommand.listSamples(profileId, options);
			});

		samples
			.command('add')
			.description('Add a reference sample from an audio file')
			.argument('<profile-id>', 'profile id')
			.argument('<file>', 'audio file path')
			.argument('<reference-text>', 'transcript of the sample')
			.option('--base-url <url>', 'API base url')
			.action(async (profileId: string, file: string, referenceText: string, options: GlobalOptions) => {
				await ProfilesCommand.addSample(profileId, file, referenceText, options);
			});

		samples
			.command('update')
			.description('Update a sample\'s reference text')
			.argument('<sample-id>', 'sample id')
			.argument('<reference-text>', 'new transcript')
			.option('--base-url <url>', 'API base url')
			.action(async (sampleId: string, referenceText: string, options: GlobalOptions) => {
				await ProfilesCommand.updateSample(sampleId, referenceText, options);
			});

		samples
			.command('delete')
			.description('Delete a sample')
			.argument('<sample-id>', 'sample id')
			.option('--base-url <url>', 'API base url')
			.action(async (sampleId: string, options: GlobalOptions) => {
				await ProfilesCommand.deleteSample(sampleId, options);
			});
	}

	static async list(options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const profiles = await client.listProfiles();
		for (const profile of profiles) {
			console.log(`${profile.id}  ${profile.name}  (${profile.language}, ${profile.sample_count} samples)`);
		}
	}

	static async get(id: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		console.log(JSON.stringify(await client.getProfile(id), null, 2));
	}

	static async create(name: string, options: CreateOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const profile = await client.createProfile(ProfilesCommand.toInput(name, options));
		console.log(`created profile ${profile.id} (${profile.name})`);
	}

	static async update(id: string, options: CreateOptions & { name?: string }): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const current = await client.getProfile(id);
		const merged: VoiceProfileInput = {
			name: options.name ?? current.name,
			description: options.description ?? current.description,
			language: options.language ?? current.language,
			voice_type: options.voiceType ?? current.voice_type,
			preset_engine: options.presetEngine ?? current.preset_engine,
			preset_voice_id: options.presetVoiceId ?? current.preset_voice_id,
			design_prompt: options.designPrompt ?? current.design_prompt,
			default_engine: options.defaultEngine ?? current.default_engine,
			personality: options.personality ?? current.personality,
		};
		const profile = await client.updateProfile(id, merged);
		console.log(`updated profile ${profile.id} (${profile.name})`);
	}

	static async delete(id: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		await client.deleteProfile(id);
		console.log(`deleted profile ${id}`);
	}

	static async presets(engine: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		console.log(JSON.stringify(await client.listPresetVoices(engine), null, 2));
	}

	static async export(id: string, options: GlobalOptions & { output: string }): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const bytes = await client.exportProfile(id);
		await writeFile(options.output, bytes);
		console.log(`wrote ${bytes.byteLength} bytes to ${options.output}`);
	}

	static async listSamples(profileId: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const samples = await client.listProfileSamples(profileId);
		for (const sample of samples) {
			console.log(`${sample.id}  ${sample.reference_text}`);
		}
	}

	static async addSample(
		profileId: string,
		file: string,
		referenceText: string,
		options: GlobalOptions,
	): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const data = await readFile(file);
		const sample = await client.addProfileSample(
			profileId,
			{ data, filename: basename(file) },
			referenceText,
		);
		console.log(`added sample ${sample.id} to profile ${profileId}`);
	}

	static async updateSample(sampleId: string, referenceText: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		const sample = await client.updateProfileSample(sampleId, referenceText);
		console.log(`updated sample ${sample.id}`);
	}

	static async deleteSample(sampleId: string, options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		await client.deleteProfileSample(sampleId);
		console.log(`deleted sample ${sampleId}`);
	}

	private static toInput(name: string, options: CreateOptions): VoiceProfileInput {
		return {
			name,
			description: options.description,
			language: options.language,
			voice_type: options.voiceType,
			preset_engine: options.presetEngine,
			preset_voice_id: options.presetVoiceId,
			design_prompt: options.designPrompt,
			default_engine: options.defaultEngine,
			personality: options.personality,
		};
	}
}
