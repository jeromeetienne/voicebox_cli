import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AudioConvert } from '../src/misc/audio_convert.js';
import { TranscribeCommand } from '../src/commands/transcribe_command.js';
import { TestHelpers } from './test_helpers.js';

afterEach(() => {
	TestHelpers.restore();
});

function silenceWav(seconds = 0.1, sampleRate = 8000): Uint8Array {
	const numSamples = Math.floor(seconds * sampleRate);
	const dataSize = numSamples * 2;
	const buffer = new ArrayBuffer(44 + dataSize);
	const view = new DataView(buffer);
	const writeString = (offset: number, value: string): void => {
		for (let i = 0; i < value.length; i++) {
			view.setUint8(offset + i, value.charCodeAt(i));
		}
	};
	writeString(0, 'RIFF');
	view.setUint32(4, 36 + dataSize, true);
	writeString(8, 'WAVE');
	writeString(12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	writeString(36, 'data');
	view.setUint32(40, dataSize, true);
	return new Uint8Array(buffer);
}

function withAudioFile(run: (file: string) => Promise<void>): Promise<void> {
	const dir = mkdtempSync(join(tmpdir(), 'vb-transcribe-'));
	const file = join(dir, 'clip.wav');
	writeFileSync(file, new Uint8Array([1, 2, 3]));
	return run(file).finally(() => rmSync(dir, { recursive: true, force: true }));
}

test('transcribe: uploads the file and prints the transcript', async () => {
	await withAudioFile(async (file) => {
		let form: FormData | undefined;
		const calls = TestHelpers.installFetch((_path, _method, init) => {
			form = init?.body as FormData;
			return TestHelpers.json({ text: 'hello world', duration: 1.5 });
		});
		const logs = TestHelpers.captureLogs();

		await TranscribeCommand.run(file, {});

		assert.equal(calls[0].path, '/transcribe');
		assert.equal(calls[0].method, 'POST');
		assert.ok(form instanceof FormData);
		assert.ok(form?.get('file') instanceof Blob);
		assert.equal(form?.get('language'), null);
		assert.equal(form?.get('model'), null);
		assert.ok(logs.some((l) => l === 'hello world'));
	});
});

test('transcribe: forwards language and model form fields', async () => {
	await withAudioFile(async (file) => {
		let form: FormData | undefined;
		TestHelpers.installFetch((_path, _method, init) => {
			form = init?.body as FormData;
			return TestHelpers.json({ text: 'bonjour', duration: 0.9 });
		});
		TestHelpers.captureLogs();

		await TranscribeCommand.run(file, { language: 'fr', model: 'turbo' });

		assert.equal(form?.get('language'), 'fr');
		assert.equal(form?.get('model'), 'turbo');
	});
});

test('transcribe: converts a non-wav file to wav before upload', async () => {
	const mp3 = await AudioConvert.wavToMp3(silenceWav(), '64k');
	const dir = mkdtempSync(join(tmpdir(), 'vb-transcribe-'));
	const file = join(dir, 'clip.mp3');
	writeFileSync(file, mp3);

	try {
		let form: FormData | undefined;
		const calls = TestHelpers.installFetch((_path, _method, init) => {
			form = init?.body as FormData;
			return TestHelpers.json({ text: 'converted', duration: 0.1 });
		});
		const logs = TestHelpers.captureLogs();

		await TranscribeCommand.run(file, {});

		assert.equal(calls[0].path, '/transcribe');
		const uploaded = form?.get('file') as File;
		assert.equal(uploaded.name, 'clip.wav');

		const bytes = new Uint8Array(await uploaded.arrayBuffer());
		const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
		assert.equal(riff, 'RIFF', 'expected the upload to be transcoded to WAV');
		assert.ok(logs.some((l) => l === 'converted'));
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('transcribe: --json prints the raw response', async () => {
	await withAudioFile(async (file) => {
		TestHelpers.installFetch(() => TestHelpers.json({ text: 'hi', duration: 0.3 }));
		const logs = TestHelpers.captureLogs();

		await TranscribeCommand.run(file, { json: true });

		const printed = JSON.parse(logs.join('\n'));
		assert.deepEqual(printed, { text: 'hi', duration: 0.3 });
	});
});
