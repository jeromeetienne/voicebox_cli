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

export class VoiceboxClient {
	private readonly baseUrl: string;

	constructor(baseUrl = 'http://127.0.0.1:17493') {
		this.baseUrl = baseUrl.replace(/\/+$/, '');
	}

	async speak(request: SpeakRequest): Promise<GenerationResponse> {
		const response = await fetch(`${this.baseUrl}/speak`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(request),
		});

		if (response.ok === false) {
			const detail = await response.text();
			throw new Error(`speak failed (${response.status}): ${detail}`);
		}

		return (await response.json()) as GenerationResponse;
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
		const response = await fetch(`${this.baseUrl}/audio/${generationId}`);

		if (response.ok === false) {
			const detail = await response.text();
			throw new Error(`downloadAudio failed (${response.status}): ${detail}`);
		}

		return new Uint8Array(await response.arrayBuffer());
	}
}
