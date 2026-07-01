/** TTS engines accepted by the API. */
export type SpeakEngine =
	| 'qwen'
	| 'qwen_custom_voice'
	| 'luxtts'
	| 'chatterbox'
	| 'chatterbox_turbo'
	| 'tada'
	| 'kokoro';

/** ISO-639-1 style language codes accepted by the API. */
export type SpeakLanguage =
	| 'zh' | 'en' | 'ja' | 'ko' | 'de' | 'fr' | 'ru' | 'pt' | 'es'
	| 'it' | 'he' | 'ar' | 'da' | 'el' | 'fi' | 'hi' | 'ms' | 'nl'
	| 'no' | 'pl' | 'sv' | 'sw' | 'tr';

/** Body for the simplified `POST /speak` endpoint. */
export type SpeakRequest = {
	text: string;
	profile?: string;
	engine?: SpeakEngine;
	personality?: boolean;
	language?: SpeakLanguage;
};

/** A generation record returned by the speak/generate endpoints. */
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

/** A single past generation as returned by the history endpoints. */
export type HistoryItem = {
	id: string;
	profile_id: string;
	profile_name: string;
	text: string;
	language: string;
	audio_path: string | null;
	duration: number | null;
	seed: number | null;
	engine: string | null;
	model_size: string | null;
	status: string;
	error: string | null;
	is_favorited: boolean;
	created_at: string;
};

/** A page of history items plus the total count matching the query. */
export type HistoryListResponse = {
	items: HistoryItem[];
	total: number;
};

/** Filters and pagination for {@link VoiceboxClient.listHistory}. */
export type HistoryListParams = {
	profileId?: string;
	search?: string;
	limit?: number;
	offset?: number;
};

/** Body for the full-control `POST /generate` endpoint. */
export type GenerationRequest = {
	profile_id: string;
	text: string;
	language?: string;
	seed?: number | null;
	model_size?: string | null;
	instruct?: string | null;
	engine?: string | null;
	personality?: boolean;
	max_chunk_chars?: number;
	crossfade_ms?: number;
	normalize?: boolean;
	effects_chain?: unknown[] | null;
};

/** A status event streamed from `GET /generate/{id}/status`. */
export type GenerationStatus = {
	id: string;
	status: string;
	duration: number;
	error: string | null;
	source: string;
};

/** Server health, model, and GPU/backend status. */
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

/** Health of one server-managed directory. */
export type DirectoryCheck = {
	path: string;
	exists: boolean;
	writable: boolean;
	error: string | null;
};

/** Filesystem health: disk space and per-directory checks. */
export type FilesystemHealthResponse = {
	healthy: boolean;
	disk_free_mb: number | null;
	disk_total_mb: number | null;
	directories: DirectoryCheck[];
};

/** An audio output channel that routes voices to devices. */
export type AudioChannel = {
	id: string;
	name: string;
	is_default: boolean;
	device_ids: string[];
	created_at: string;
};

/** Fields accepted when creating or updating a channel. */
export type AudioChannelInput = {
	name?: string | null;
	device_ids?: string[] | null;
};

/** A voice profile as returned by the profile endpoints. */
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

/** Fields accepted when creating or replacing a profile. */
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

/** A reference audio sample attached to a profile. */
export type ProfileSample = {
	id: string;
	profile_id: string;
	audio_path: string;
	reference_text: string;
};

/** Status of a single model as returned by `GET /models/status`. */
export type ModelStatus = {
	model_name: string;
	display_name: string;
	hf_repo_id: string | null;
	downloaded: boolean;
	downloading?: boolean;
	size_mb: number | null;
	loaded?: boolean;
};

/** The list of model statuses returned by `GET /models/status`. */
export type ModelStatusListResponse = {
	models: ModelStatus[];
};

/**
 * Thin HTTP client for the voicebox TTS API.
 *
 * Every method maps to a single endpoint. JSON responses are parsed and
 * typed; binary endpoints return raw bytes. Non-2xx responses throw an
 * `Error` that includes the method, path, status, and response body.
 */
export class VoiceboxClient {
	private readonly baseUrl: string;

	/**
	 * @param baseUrl Base URL of the voicebox API; a trailing slash is trimmed.
	 */
	constructor(baseUrl = 'http://127.0.0.1:17493') {
		this.baseUrl = baseUrl.replace(/\/+$/, '');
	}

	/** Perform a request and parse the JSON body as `T`, throwing on non-2xx. */
	private async requestJson<T>(path: string, init?: RequestInit): Promise<T> {
		const response = await fetch(`${this.baseUrl}${path}`, init);
		if (response.ok === false) {
			const detail = await response.text();
			throw new Error(`${init?.method ?? 'GET'} ${path} failed (${response.status}): ${detail}`);
		}
		return (await response.json()) as T;
	}

	/** Perform a request and return the raw response bytes, throwing on non-2xx. */
	private async requestBytes(path: string, init?: RequestInit): Promise<Uint8Array> {
		const response = await fetch(`${this.baseUrl}${path}`, init);
		if (response.ok === false) {
			const detail = await response.text();
			throw new Error(`${init?.method ?? 'GET'} ${path} failed (${response.status}): ${detail}`);
		}
		return new Uint8Array(await response.arrayBuffer());
	}

	/** Perform a request, discarding the body, throwing on non-2xx. */
	private async requestVoid(path: string, init?: RequestInit): Promise<void> {
		const response = await fetch(`${this.baseUrl}${path}`, init);
		if (response.ok === false) {
			const detail = await response.text();
			throw new Error(`${init?.method ?? 'GET'} ${path} failed (${response.status}): ${detail}`);
		}
	}

	/** Build request init for a JSON body (content-type + serialized body). */
	private jsonBody(body: unknown): RequestInit {
		return {
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body),
		};
	}

	/**
	 * Consume a server-sent event stream, yielding each `data:` payload
	 * parsed as JSON, throwing on non-2xx.
	 */
	private async *streamEvents(path: string, init?: RequestInit): AsyncGenerator<unknown> {
		const response = await fetch(`${this.baseUrl}${path}`, init);
		if (response.ok === false || response.body === null) {
			const detail = await response.text();
			throw new Error(`${init?.method ?? 'GET'} ${path} failed (${response.status}): ${detail}`);
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

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
				yield JSON.parse(line.slice('data:'.length).trim());
			}

			if (done === true) {
				break;
			}
		}
	}

	/** Get server health, model, and GPU/backend status (`GET /health`). */
	async health(): Promise<HealthResponse> {
		return await this.requestJson<HealthResponse>('/health');
	}

	/** Request a graceful server shutdown (`POST /shutdown`). */
	async shutdown(): Promise<void> {
		await this.requestVoid('/shutdown', { method: 'POST' });
	}

	/** Disable the parent-process watchdog (`POST /watchdog/disable`). */
	async disableWatchdog(): Promise<void> {
		await this.requestVoid('/watchdog/disable', { method: 'POST' });
	}

	/** List all audio channels (`GET /channels`). */
	async listChannels(): Promise<AudioChannel[]> {
		return await this.requestJson<AudioChannel[]>('/channels');
	}

	/** Get a single channel by id (`GET /channels/{id}`). */
	async getChannel(channelId: string): Promise<AudioChannel> {
		return await this.requestJson<AudioChannel>(`/channels/${channelId}`);
	}

	/**
	 * Create a channel (`POST /channels`).
	 *
	 * @param name Channel name.
	 * @param deviceIds Output device ids to bind to the channel.
	 */
	async createChannel(name: string, deviceIds: string[] = []): Promise<AudioChannel> {
		return await this.requestJson<AudioChannel>('/channels', {
			method: 'POST',
			...this.jsonBody({ name, device_ids: deviceIds }),
		});
	}

	/** Update a channel's name and/or devices (`PUT /channels/{id}`). */
	async updateChannel(channelId: string, input: AudioChannelInput): Promise<AudioChannel> {
		return await this.requestJson<AudioChannel>(`/channels/${channelId}`, {
			method: 'PUT',
			...this.jsonBody(input),
		});
	}

	/** Delete a channel (`DELETE /channels/{id}`). */
	async deleteChannel(channelId: string): Promise<void> {
		await this.requestVoid(`/channels/${channelId}`, { method: 'DELETE' });
	}

	/** Get the profile ids assigned to a channel (`GET /channels/{id}/voices`). */
	async getChannelVoices(channelId: string): Promise<unknown> {
		return await this.requestJson<unknown>(`/channels/${channelId}/voices`);
	}

	/** Replace the profiles assigned to a channel (`PUT /channels/{id}/voices`). */
	async setChannelVoices(channelId: string, profileIds: string[]): Promise<unknown> {
		return await this.requestJson<unknown>(`/channels/${channelId}/voices`, {
			method: 'PUT',
			...this.jsonBody({ profile_ids: profileIds }),
		});
	}

	/** Check filesystem health: directories and disk space (`GET /health/filesystem`). */
	async filesystemHealth(): Promise<FilesystemHealthResponse> {
		return await this.requestJson<FilesystemHealthResponse>('/health/filesystem');
	}

	/** List all voice profiles (`GET /profiles`). */
	async listProfiles(): Promise<VoiceProfile[]> {
		return await this.requestJson<VoiceProfile[]>('/profiles');
	}

	/** Get a single profile by id (`GET /profiles/{id}`). */
	async getProfile(profileId: string): Promise<VoiceProfile> {
		return await this.requestJson<VoiceProfile>(`/profiles/${profileId}`);
	}

	/** Create a profile (`POST /profiles`). */
	async createProfile(input: VoiceProfileInput): Promise<VoiceProfile> {
		return await this.requestJson<VoiceProfile>('/profiles', {
			method: 'POST',
			...this.jsonBody(input),
		});
	}

	/**
	 * Replace a profile (`PUT /profiles/{id}`).
	 *
	 * The endpoint is a full replacement, so `input` should carry every field
	 * to keep — callers that want a partial update must merge first.
	 */
	async updateProfile(profileId: string, input: VoiceProfileInput): Promise<VoiceProfile> {
		return await this.requestJson<VoiceProfile>(`/profiles/${profileId}`, {
			method: 'PUT',
			...this.jsonBody(input),
		});
	}

	/** Delete a profile (`DELETE /profiles/{id}`). */
	async deleteProfile(profileId: string): Promise<void> {
		await this.requestVoid(`/profiles/${profileId}`, { method: 'DELETE' });
	}

	/** List an engine's preset voices (`GET /profiles/presets/{engine}`). */
	async listPresetVoices(engine: string): Promise<unknown> {
		return await this.requestJson<unknown>(`/profiles/presets/${engine}`);
	}

	/** Export a profile as a zip archive (`GET /profiles/{id}/export`). */
	async exportProfile(profileId: string): Promise<Uint8Array> {
		return await this.requestBytes(`/profiles/${profileId}/export`);
	}

	/** List a profile's reference samples (`GET /profiles/{id}/samples`). */
	async listProfileSamples(profileId: string): Promise<ProfileSample[]> {
		return await this.requestJson<ProfileSample[]>(`/profiles/${profileId}/samples`);
	}

	/**
	 * Add a reference sample from an audio file (`POST /profiles/{id}/samples`).
	 *
	 * @param profileId Target profile id.
	 * @param file Audio bytes and the filename to send in the multipart body.
	 * @param referenceText Transcript of the sample audio.
	 */
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

	/** Update a sample's transcript (`PUT /profiles/samples/{id}`). */
	async updateProfileSample(sampleId: string, referenceText: string): Promise<ProfileSample> {
		return await this.requestJson<ProfileSample>(`/profiles/samples/${sampleId}`, {
			method: 'PUT',
			...this.jsonBody({ reference_text: referenceText }),
		});
	}

	/** Delete a sample (`DELETE /profiles/samples/{id}`). */
	async deleteProfileSample(sampleId: string): Promise<void> {
		await this.requestVoid(`/profiles/samples/${sampleId}`, { method: 'DELETE' });
	}

	/**
	 * List past generations with optional filters (`GET /history`).
	 *
	 * @param params Profile filter, free-text search, and pagination.
	 */
	async listHistory(params: HistoryListParams = {}): Promise<HistoryListResponse> {
		const query = new URLSearchParams();
		if (params.profileId !== undefined) {
			query.set('profile_id', params.profileId);
		}
		if (params.search !== undefined) {
			query.set('search', params.search);
		}
		if (params.limit !== undefined) {
			query.set('limit', String(params.limit));
		}
		if (params.offset !== undefined) {
			query.set('offset', String(params.offset));
		}
		const suffix = query.toString();
		return await this.requestJson<HistoryListResponse>(`/history${suffix === '' ? '' : `?${suffix}`}`);
	}

	/** Get a single history item by id (`GET /history/{id}`). */
	async getHistory(generationId: string): Promise<HistoryItem> {
		return await this.requestJson<HistoryItem>(`/history/${generationId}`);
	}

	/** Get aggregate generation statistics (`GET /history/stats`). */
	async historyStats(): Promise<unknown> {
		return await this.requestJson<unknown>('/history/stats');
	}

	/** Delete a history item (`DELETE /history/{id}`). */
	async deleteHistory(generationId: string): Promise<void> {
		await this.requestVoid(`/history/${generationId}`, { method: 'DELETE' });
	}

	/** Toggle a history item's favorite flag (`POST /history/{id}/favorite`). */
	async toggleFavorite(generationId: string): Promise<void> {
		await this.requestVoid(`/history/${generationId}/favorite`, { method: 'POST' });
	}

	/** Delete all failed generations (`DELETE /history/failed`). */
	async clearFailedHistory(): Promise<void> {
		await this.requestVoid('/history/failed', { method: 'DELETE' });
	}

	/** Export a generation as a zip archive (`GET /history/{id}/export`). */
	async exportHistory(generationId: string): Promise<Uint8Array> {
		return await this.requestBytes(`/history/${generationId}/export`);
	}

	/** Export a generation's audio (`GET /history/{id}/export-audio`). */
	async exportHistoryAudio(generationId: string): Promise<Uint8Array> {
		return await this.requestBytes(`/history/${generationId}/export-audio`);
	}

	/**
	 * Start a generation with full request control (`POST /generate`).
	 *
	 * Returns immediately; the job runs asynchronously. Use
	 * {@link VoiceboxClient.waitForCompletion} to await the result.
	 */
	async generate(request: GenerationRequest): Promise<GenerationResponse> {
		return await this.requestJson<GenerationResponse>('/generate', {
			method: 'POST',
			...this.jsonBody(request),
		});
	}

	/** Retry a failed generation (`POST /generate/{id}/retry`). */
	async retryGeneration(generationId: string): Promise<GenerationResponse> {
		return await this.requestJson<GenerationResponse>(`/generate/${generationId}/retry`, {
			method: 'POST',
		});
	}

	/** Regenerate a generation from scratch (`POST /generate/{id}/regenerate`). */
	async regenerateGeneration(generationId: string): Promise<GenerationResponse> {
		return await this.requestJson<GenerationResponse>(`/generate/${generationId}/regenerate`, {
			method: 'POST',
		});
	}

	/** Cancel an in-progress generation (`POST /generate/{id}/cancel`). */
	async cancelGeneration(generationId: string): Promise<void> {
		await this.requestVoid(`/generate/${generationId}/cancel`, { method: 'POST' });
	}

	/**
	 * Start a generation via the simplified endpoint (`POST /speak`).
	 *
	 * Returns immediately; use {@link VoiceboxClient.waitForCompletion} to
	 * await the result.
	 */
	async speak(request: SpeakRequest): Promise<GenerationResponse> {
		return await this.requestJson<GenerationResponse>('/speak', {
			method: 'POST',
			...this.jsonBody(request),
		});
	}

	/**
	 * Wait for a generation to finish by consuming its status stream
	 * (`GET /generate/{id}/status`).
	 *
	 * Reads the server-sent event stream until a `completed` or `failed`
	 * status arrives, then returns it.
	 *
	 * @returns The terminal status event.
	 * @throws If the stream closes before any status is received.
	 */
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

	/** Download a completed generation's audio (`GET /audio/{id}`). */
	async downloadAudio(generationId: string): Promise<Uint8Array> {
		return await this.requestBytes(`/audio/${generationId}`);
	}

	/** Get the status of all available models (`GET /models/status`). */
	async modelStatus(): Promise<ModelStatusListResponse> {
		return await this.requestJson<ModelStatusListResponse>('/models/status');
	}

	/** Manually load the default TTS model at the given size (`POST /models/load`). */
	async loadModel(modelSize?: string): Promise<unknown> {
		const query = modelSize === undefined ? '' : `?model_size=${encodeURIComponent(modelSize)}`;
		return await this.requestJson<unknown>(`/models/load${query}`, { method: 'POST' });
	}

	/** Unload the default TTS model to free memory (`POST /models/unload`). */
	async unloadModel(): Promise<unknown> {
		return await this.requestJson<unknown>('/models/unload', { method: 'POST' });
	}

	/** Unload a specific model from memory without deleting it (`POST /models/{name}/unload`). */
	async unloadModelByName(modelName: string): Promise<unknown> {
		return await this.requestJson<unknown>(`/models/${encodeURIComponent(modelName)}/unload`, {
			method: 'POST',
		});
	}

	/** Trigger download of a specific model (`POST /models/download`). */
	async downloadModel(modelName: string): Promise<unknown> {
		return await this.requestJson<unknown>('/models/download', {
			method: 'POST',
			...this.jsonBody({ model_name: modelName }),
		});
	}

	/** Cancel or dismiss an errored/stale download task (`POST /models/download/cancel`). */
	async cancelModelDownload(modelName: string): Promise<unknown> {
		return await this.requestJson<unknown>('/models/download/cancel', {
			method: 'POST',
			...this.jsonBody({ model_name: modelName }),
		});
	}

	/** Delete a downloaded model from the HuggingFace cache (`DELETE /models/{name}`). */
	async deleteModel(modelName: string): Promise<unknown> {
		return await this.requestJson<unknown>(`/models/${encodeURIComponent(modelName)}`, {
			method: 'DELETE',
		});
	}

	/** Get the HuggingFace model cache directory (`GET /models/cache-dir`). */
	async modelsCacheDir(): Promise<unknown> {
		return await this.requestJson<unknown>('/models/cache-dir');
	}

	/** Stream download progress for a model (`GET /models/progress/{name}`). */
	streamModelProgress(modelName: string): AsyncGenerator<unknown> {
		return this.streamEvents(`/models/progress/${encodeURIComponent(modelName)}`);
	}

	/** Move all downloaded models to a new directory, streaming progress (`POST /models/migrate`). */
	migrateModels(destination: string): AsyncGenerator<unknown> {
		return this.streamEvents('/models/migrate', {
			method: 'POST',
			...this.jsonBody({ destination }),
		});
	}

	/** Stream the progress of an in-flight model migration (`GET /models/migrate/progress`). */
	streamMigrationProgress(): AsyncGenerator<unknown> {
		return this.streamEvents('/models/migrate/progress');
	}
}
