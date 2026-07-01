import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SpeakCommand } from '../src/commands/speak_command.js';
import { TestHelpers } from './test_helpers.js';

const audioBytes = new Uint8Array([9, 8, 7, 6]);

afterEach(() => {
	TestHelpers.restore();
});

function stubSpeakApi(): void {
	TestHelpers.installFetch((path, method) => {
		if (path === '/speak' && method === 'POST') {
			return TestHelpers.json({ id: 'g1', status: 'generating' });
		}
		if (path === '/generate/g1/status') {
			return TestHelpers.sse([{ id: 'g1', status: 'completed', duration: 1.2, error: null, source: 'manual' }]);
		}
		if (path === '/audio/g1') {
			return new Response(audioBytes, { status: 200 });
		}
		return new Response('not found', { status: 404 });
	});
}

test('speak: sends the request, waits, downloads, and writes the file', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'vb-speak-'));
	const output = join(dir, 'out.wav');
	stubSpeakApi();
	const logs = TestHelpers.captureLogs();

	try {
		await SpeakCommand.run('hello', { output, profile: 'Test', language: 'en' });
		assert.deepEqual(new Uint8Array(readFileSync(output)), audioBytes);
		assert.ok(logs.some((l) => l.includes('queued generation g1')));
		assert.ok(logs.some((l) => l.includes(output)));
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('speak: passes profile/engine/language/personality through to /speak', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'vb-speak-'));
	const output = join(dir, 'out.wav');
	const calls = TestHelpers.installFetch((path, method) => {
		if (path === '/speak' && method === 'POST') {
			return TestHelpers.json({ id: 'g1', status: 'generating' });
		}
		if (path === '/generate/g1/status') {
			return TestHelpers.sse([{ id: 'g1', status: 'completed', duration: 1, error: null, source: 'manual' }]);
		}
		return new Response(audioBytes, { status: 200 });
	});
	TestHelpers.captureLogs();

	try {
		await SpeakCommand.run('hi', { output, profile: 'Narrator', engine: 'qwen', language: 'fr', personality: true });
		const speakCall = calls.find((c) => c.path === '/speak');
		assert.deepEqual(JSON.parse(String(speakCall?.body)), {
			text: 'hi',
			profile: 'Narrator',
			engine: 'qwen',
			language: 'fr',
			personality: true,
		});
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('speak: throws when generation fails', async () => {
	TestHelpers.installFetch((path) => {
		if (path === '/speak') {
			return TestHelpers.json({ id: 'g1', status: 'generating' });
		}
		return TestHelpers.sse([{ id: 'g1', status: 'failed', duration: 0, error: 'nope', source: 'manual' }]);
	});
	TestHelpers.captureLogs();
	await assert.rejects(SpeakCommand.run('hi', { output: 'unused.wav' }), /generation failed: nope/);
});
