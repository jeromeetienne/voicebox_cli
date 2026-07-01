export type SpeakEngine =
	| 'qwen'
	| 'qwen_custom_voice'
	| 'luxtts'
	| 'chatterbox'
	| 'chatterbox_turbo'
	| 'tada'
	| 'kokoro';

export type SpeakLanguage =
	| 'zh' | 'en' | 'ja' | 'ko' | 'de' | 'fr' | 'ru' | 'pt' | 'es'
	| 'it' | 'he' | 'ar' | 'da' | 'el' | 'fi' | 'hi' | 'ms' | 'nl'
	| 'no' | 'pl' | 'sv' | 'sw' | 'tr';

export type SpeakRequest = {
	text: string;
	profile?: string;
	engine?: SpeakEngine;
	personality?: boolean;
	language?: SpeakLanguage;
};

export type GenerationResponse = {
	id: string;
	profile_id: string;
	text: string;
	language: string;
	audio_path: string | null;
	duration: number | null;
	seed: number | null;
	engine: string | null;
	status: string;
	error: string | null;
	created_at: string;
};

export type GenerationStatus = {
	id: string;
	status: string;
	duration: number;
	error: string | null;
	source: string;
};

export type HealthResponse = {
	status: string;
	model_loaded: boolean;
	model_downloaded: boolean | null;
	model_size: string | null;
	gpu_available: boolean;
	gpu_type: string | null;
	vram_used_mb: number | null;
	backend_type: string | null;
	backend_variant: string | null;
	gpu_compatibility_warning: string | null;
};

export type DirectoryCheck = {
	path: string;
	exists: boolean;
	writable: boolean;
	error: string | null;
};

export type FilesystemHealthResponse = {
	healthy: boolean;
	disk_free_mb: number | null;
	disk_total_mb: number | null;
	directories: DirectoryCheck[];
};

export type AudioChannel = {
	id: string;
	name: string;
	is_default: boolean;
	device_ids: string[];
	created_at: string;
};

export type AudioChannelInput = {
	name?: string | null;
	device_ids?: string[] | null;
};

export type VoiceProfile = {
	id: string;
	name: string;
	description: string | null;
	language: string;
	avatar_path: string | null;
	effects_chain: unknown[] | null;
	voice_type: string;
	preset_engine: string | null;
	preset_voice_id: string | null;
	design_prompt: string | null;
	default_engine: string | null;
	personality: string | null;
	generation_count: number;
	sample_count: number;
	created_at: string;
	updated_at: string;
};

export type VoiceProfileInput = {
	name: string;
	description?: string | null;
	language?: string;
	voice_type?: string | null;
	preset_engine?: string | null;
	preset_voice_id?: string | null;
	design_prompt?: string | null;
	default_engine?: string | null;
	personality?: string | null;
};

export type ProfileSample = {
	id: string;
	profile_id: string;
	audio_path: string;
	reference_text: string;
};

export class VoiceboxClient {
	private readonly baseUrl: string;

	constructor(baseUrl = 'http://127.0.0.1:17493') {
		this.baseUrl = baseUrl.replace(/\/+$/, '');
	}

	private async requestJson<T>(path: string, init?: RequestInit): Promise<T> {
		const response = await fetch(`${this.baseUrl}${path}`, init);
		if (response.ok === false) {
			const detail = await response.text();
			throw new Error(`${init?.method ?? 'GET'} ${path} failed (${response.status}): ${detail}`);
		}
		return (await response.json()) as T;
	}

	private async requestBytes(path: string, init?: RequestInit): Promise<Uint8Array> {
		const response = await fetch(`${this.baseUrl}${path}`, init);
		if (response.ok === false) {
			const detail = await response.text();
			throw new Error(`${init?.method ?? 'GET'} ${path} failed (${response.status}): ${detail}`);
		}
		return new Uint8Array(await response.arrayBuffer());
	}

	private async requestVoid(path: string, init?: RequestInit): Promise<void> {
		const response = await fetch(`${this.baseUrl}${path}`, init);
		if (response.ok === false) {
			const detail = await response.text();
			throw new Error(`${init?.method ?? 'GET'} ${path} failed (${response.status}): ${detail}`);
		}
	}

	private jsonBody(body: unknown): RequestInit {
		return {
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body),
		};
	}

	async health(): Promise<HealthResponse> {
		return await this.requestJson<HealthResponse>('/health');
	}

	async shutdown(): Promise<void> {
		await this.requestVoid('/shutdown', { method: 'POST' });
	}

	async disableWatchdog(): Promise<void> {
		await this.requestVoid('/watchdog/disable', { method: 'POST' });
	}

	async listChannels(): Promise<AudioChannel[]> {
		return await this.requestJson<AudioChannel[]>('/channels');
	}

	async getChannel(channelId: string): Promise<AudioChannel> {
		return await this.requestJson<AudioChannel>(`/channels/${channelId}`);
	}

	async createChannel(name: string, deviceIds: string[] = []): Promise<AudioChannel> {
		return await this.requestJson<AudioChannel>('/channels', {
			method: 'POST',
			...this.jsonBody({ name, device_ids: deviceIds }),
		});
	}

	async updateChannel(channelId: string, input: AudioChannelInput): Promise<AudioChannel> {
		return await this.requestJson<AudioChannel>(`/channels/${channelId}`, {
			method: 'PUT',
			...this.jsonBody(input),
		});
	}

	async deleteChannel(channelId: string): Promise<void> {
		await this.requestVoid(`/channels/${channelId}`, { method: 'DELETE' });
	}

	async getChannelVoices(channelId: string): Promise<unknown> {
		return await this.requestJson<unknown>(`/channels/${channelId}/voices`);
	}

	async setChannelVoices(channelId: string, profileIds: string[]): Promise<unknown> {
		return await this.requestJson<unknown>(`/channels/${channelId}/voices`, {
			method: 'PUT',
			...this.jsonBody({ profile_ids: profileIds }),
		});
	}

	async filesystemHealth(): Promise<FilesystemHealthResponse> {
		return await this.requestJson<FilesystemHealthResponse>('/health/filesystem');
	}

	async listProfiles(): Promise<VoiceProfile[]> {
		return await this.requestJson<VoiceProfile[]>('/profiles');
	}

	async getProfile(profileId: string): Promise<VoiceProfile> {
		return await this.requestJson<VoiceProfile>(`/profiles/${profileId}`);
	}

	async createProfile(input: VoiceProfileInput): Promise<VoiceProfile> {
		return await this.requestJson<VoiceProfile>('/profiles', {
			method: 'POST',
			...this.jsonBody(input),
		});
	}

	async updateProfile(profileId: string, input: VoiceProfileInput): Promise<VoiceProfile> {
		return await this.requestJson<VoiceProfile>(`/profiles/${profileId}`, {
			method: 'PUT',
			...this.jsonBody(input),
		});
	}

	async deleteProfile(profileId: string): Promise<void> {
		await this.requestVoid(`/profiles/${profileId}`, { method: 'DELETE' });
	}

	async listPresetVoices(engine: string): Promise<unknown> {
		return await this.requestJson<unknown>(`/profiles/presets/${engine}`);
	}

	async exportProfile(profileId: string): Promise<Uint8Array> {
		return await this.requestBytes(`/profiles/${profileId}/export`);
	}

	async listProfileSamples(profileId: string): Promise<ProfileSample[]> {
		return await this.requestJson<ProfileSample[]>(`/profiles/${profileId}/samples`);
	}

	async addProfileSample(
		profileId: string,
		file: { data: Uint8Array; filename: string },
		referenceText: string,
	): Promise<ProfileSample> {
		const form = new FormData();
		form.append('file', new Blob([file.data as BlobPart]), file.filename);
		form.append('reference_text', referenceText);
		return await this.requestJson<ProfileSample>(`/profiles/${profileId}/samples`, {
			method: 'POST',
			body: form,
		});
	}

	async updateProfileSample(sampleId: string, referenceText: string): Promise<ProfileSample> {
		return await this.requestJson<ProfileSample>(`/profiles/samples/${sampleId}`, {
			method: 'PUT',
			...this.jsonBody({ reference_text: referenceText }),
		});
	}

	async deleteProfileSample(sampleId: string): Promise<void> {
		await this.requestVoid(`/profiles/samples/${sampleId}`, { method: 'DELETE' });
	}

	async speak(request: SpeakRequest): Promise<GenerationResponse> {
		return await this.requestJson<GenerationResponse>('/speak', {
			method: 'POST',
			...this.jsonBody(request),
		});
	}

	async waitForCompletion(generationId: string): Promise<GenerationStatus> {
		const response = await fetch(`${this.baseUrl}/generate/${generationId}/status`);

		if (response.ok === false || response.body === null) {
			const detail = await response.text();
			throw new Error(`status failed (${response.status}): ${detail}`);
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let last: GenerationStatus | undefined;

		while (true) {
			const { done, value } = await reader.read();
			if (value !== undefined) {
				buffer += decoder.decode(value, { stream: true });
			}

			const lines = buffer.split('\n');
			buffer = lines.pop() ?? '';

			for (const line of lines) {
				if (line.startsWith('data:') === false) {
					continue;
				}
				last = JSON.parse(line.slice('data:'.length).trim()) as GenerationStatus;
				if (last.status === 'completed' || last.status === 'failed') {
					await reader.cancel();
					return last;
				}
			}

			if (done === true) {
				break;
			}
		}

		if (last === undefined) {
			throw new Error('status stream closed without any update');
		}
		return last;
	}

	async downloadAudio(generationId: string): Promise<Uint8Array> {
		return await this.requestBytes(`/audio/${generationId}`);
	}
}
