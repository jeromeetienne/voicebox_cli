import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TranscribeCommand } from '../src/commands/transcribe_command.js';
import { TestHelpers } from './test_helpers.js';

afterEach(() => {
	TestHelpers.restore();
});

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

		await TranscribeCommand.run(file, { language: 'fr', model: 'whisper-turbo' });

		assert.equal(form?.get('language'), 'fr');
		assert.equal(form?.get('model'), 'whisper-turbo');
	});
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
