import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { HistoryCommand } from '../src/commands/history_command.js';
import { TestHelpers } from './test_helpers.js';

afterEach(() => {
	TestHelpers.restore();
});

const item = {
	id: 'h1',
	profile_id: 'p1',
	profile_name: 'donaldy',
	text: 'a short line',
	language: 'en',
	status: 'completed',
	is_favorited: true,
};

test('history: list builds query params and prints items with a total', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ items: [item], total: 42 }));
	const logs = TestHelpers.captureLogs();

	await HistoryCommand.list({ profile: 'p1', search: 'line', limit: 10, offset: 5 });

	const url = new URL(calls[0].url);
	assert.equal(url.pathname, '/history');
	assert.equal(url.searchParams.get('profile_id'), 'p1');
	assert.equal(url.searchParams.get('search'), 'line');
	assert.equal(url.searchParams.get('limit'), '10');
	assert.equal(url.searchParams.get('offset'), '5');
	assert.ok(logs.some((l) => l.includes('★') && l.includes('h1') && l.includes('donaldy')));
	assert.ok(logs.some((l) => l.includes('1 shown / 42 total')));
});

test('history: list omits unset query params', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ items: [], total: 0 }));
	TestHelpers.captureLogs();

	await HistoryCommand.list({});
	assert.equal(calls[0].url.endsWith('/history'), true);
});

test('history: favorite POSTs to the favorite endpoint', async () => {
	const calls = TestHelpers.installFetch(() => new Response(null, { status: 200 }));
	TestHelpers.captureLogs();

	await HistoryCommand.favorite('h1', {});
	assert.equal(calls[0].path, '/history/h1/favorite');
	assert.equal(calls[0].method, 'POST');
});

test('history: delete calls DELETE', async () => {
	const calls = TestHelpers.installFetch(() => new Response(null, { status: 200 }));
	TestHelpers.captureLogs();

	await HistoryCommand.delete('h1', {});
	assert.equal(calls[0].path, '/history/h1');
	assert.equal(calls[0].method, 'DELETE');
});

test('history: clear-failed DELETEs /history/failed', async () => {
	const calls = TestHelpers.installFetch(() => new Response(null, { status: 200 }));
	TestHelpers.captureLogs();

	await HistoryCommand.clearFailed({});
	assert.equal(calls[0].path, '/history/failed');
	assert.equal(calls[0].method, 'DELETE');
});

test('history: export-audio writes bytes to the derived default path', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'vb-hist-'));
	const output = join(dir, 'h1.wav');
	const bytes = new Uint8Array([1, 2, 3]);
	TestHelpers.installFetch(() => new Response(bytes, { status: 200 }));
	TestHelpers.captureLogs();

	try {
		await HistoryCommand.exportAudio('h1', { output });
		assert.deepEqual(new Uint8Array(readFileSync(output)), bytes);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
