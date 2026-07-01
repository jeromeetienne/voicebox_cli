import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StoriesCommand } from '../src/commands/stories_command.js';
import { TestHelpers } from './test_helpers.js';

afterEach(() => {
	TestHelpers.restore();
});

const story = {
	id: 's1',
	name: 'My Story',
	description: null,
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
	item_count: 3,
};

const item = {
	id: 'i1',
	story_id: 's1',
	generation_id: 'g1',
	version_id: null,
	start_time_ms: 0,
	track: 0,
	trim_start_ms: 0,
	trim_end_ms: 0,
	volume: 1,
};

test('stories: list prints a line per story with a count footer', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json([story]));
	const logs = TestHelpers.captureLogs();

	await StoriesCommand.list({});
	assert.equal(calls[0].path, '/stories');
	assert.ok(logs.some((l) => l.includes('s1') && l.includes('My Story') && l.includes('3 items')));
	assert.ok(logs.some((l) => l.includes('1 stories')));
});

test('stories: get prints the detail JSON', async () => {
	const detail = { ...story, items: [] };
	const calls = TestHelpers.installFetch(() => TestHelpers.json(detail));
	const logs = TestHelpers.captureLogs();

	await StoriesCommand.get('s1', {});
	assert.equal(calls[0].path, '/stories/s1');
	assert.deepEqual(JSON.parse(logs.join('\n')), detail);
});

test('stories: create POSTs name and description', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json(story));
	const logs = TestHelpers.captureLogs();

	await StoriesCommand.create('My Story', { description: 'a tale' });
	assert.equal(calls[0].path, '/stories');
	assert.equal(calls[0].method, 'POST');
	assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { name: 'My Story', description: 'a tale' });
	assert.ok(logs.some((l) => l.includes('created story s1')));
});

test('stories: update PUTs to the story', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json(story));
	TestHelpers.captureLogs();

	await StoriesCommand.update('s1', 'Renamed', {});
	assert.equal(calls[0].path, '/stories/s1');
	assert.equal(calls[0].method, 'PUT');
	assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { name: 'Renamed' });
});

test('stories: delete calls DELETE', async () => {
	const calls = TestHelpers.installFetch(() => new Response(null, { status: 200 }));
	TestHelpers.captureLogs();

	await StoriesCommand.delete('s1', {});
	assert.equal(calls[0].path, '/stories/s1');
	assert.equal(calls[0].method, 'DELETE');
});

test('stories: export-audio writes bytes to the derived default path', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'vb-story-'));
	const output = join(dir, 's1.wav');
	const bytes = new Uint8Array([4, 5, 6]);
	const calls = TestHelpers.installFetch(() => new Response(bytes, { status: 200 }));
	TestHelpers.captureLogs();

	try {
		await StoriesCommand.exportAudio('s1', { output });
		assert.equal(calls[0].path, '/stories/s1/export-audio');
		assert.deepEqual(new Uint8Array(readFileSync(output)), bytes);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('stories: items add POSTs the generation with start/track', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json(item));
	const logs = TestHelpers.captureLogs();

	await StoriesCommand.itemsAdd('s1', 'g1', { startTimeMs: 1500, track: 2 });
	assert.equal(calls[0].path, '/stories/s1/items');
	assert.equal(calls[0].method, 'POST');
	assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { generation_id: 'g1', start_time_ms: 1500, track: 2 });
	assert.ok(logs.some((l) => l.includes('added item i1')));
});

test('stories: items remove calls DELETE on the item', async () => {
	const calls = TestHelpers.installFetch(() => new Response(null, { status: 200 }));
	TestHelpers.captureLogs();

	await StoriesCommand.itemsRemove('s1', 'i1', {});
	assert.equal(calls[0].path, '/stories/s1/items/i1');
	assert.equal(calls[0].method, 'DELETE');
});

test('stories: items times parses pairs into a batch update', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ ok: true }));
	TestHelpers.captureLogs();

	await StoriesCommand.itemsTimes('s1', ['g1:0', 'g2:2500'], {});
	assert.equal(calls[0].path, '/stories/s1/items/times');
	assert.equal(calls[0].method, 'PUT');
	assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), {
		updates: [
			{ generation_id: 'g1', start_time_ms: 0 },
			{ generation_id: 'g2', start_time_ms: 2500 },
		],
	});
});

test('stories: items reorder PUTs the generation ids', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json([item]));
	TestHelpers.captureLogs();

	await StoriesCommand.itemsReorder('s1', ['g2', 'g1'], {});
	assert.equal(calls[0].path, '/stories/s1/items/reorder');
	assert.equal(calls[0].method, 'PUT');
	assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { generation_ids: ['g2', 'g1'] });
});

test('stories: items move PUTs start time and omits track when unset', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ ...item, start_time_ms: 3000 }));
	TestHelpers.captureLogs();

	await StoriesCommand.itemsMove('s1', 'i1', 3000, {});
	assert.equal(calls[0].path, '/stories/s1/items/i1/move');
	assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { start_time_ms: 3000 });
});

test('stories: items move includes track when set', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ ...item, track: 1 }));
	TestHelpers.captureLogs();

	await StoriesCommand.itemsMove('s1', 'i1', 3000, { track: 1 });
	assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { start_time_ms: 3000, track: 1 });
});

test('stories: items trim PUTs the trim window', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ ...item, trim_start_ms: 100, trim_end_ms: 200 }));
	TestHelpers.captureLogs();

	await StoriesCommand.itemsTrim('s1', 'i1', 100, 200, {});
	assert.equal(calls[0].path, '/stories/s1/items/i1/trim');
	assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { trim_start_ms: 100, trim_end_ms: 200 });
});

test('stories: items volume PUTs the gain', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ ...item, volume: 0.5 }));
	TestHelpers.captureLogs();

	await StoriesCommand.itemsVolume('s1', 'i1', 0.5, {});
	assert.equal(calls[0].path, '/stories/s1/items/i1/volume');
	assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { volume: 0.5 });
});

test('stories: items split POSTs the split time and reports the new items', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json([{ ...item, id: 'i1a' }, { ...item, id: 'i1b' }]));
	const logs = TestHelpers.captureLogs();

	await StoriesCommand.itemsSplit('s1', 'i1', 1200, {});
	assert.equal(calls[0].path, '/stories/s1/items/i1/split');
	assert.equal(calls[0].method, 'POST');
	assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { split_time_ms: 1200 });
	assert.ok(logs.some((l) => l.includes('i1a') && l.includes('i1b')));
});

test('stories: items duplicate POSTs to the duplicate endpoint', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ ...item, id: 'i2' }));
	const logs = TestHelpers.captureLogs();

	await StoriesCommand.itemsDuplicate('s1', 'i1', {});
	assert.equal(calls[0].path, '/stories/s1/items/i1/duplicate');
	assert.equal(calls[0].method, 'POST');
	assert.ok(logs.some((l) => l.includes('duplicated item i1 as i2')));
});

test('stories: items version pins a version id', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ ...item, version_id: 'v9' }));
	const logs = TestHelpers.captureLogs();

	await StoriesCommand.itemsVersion('s1', 'i1', 'v9', {});
	assert.equal(calls[0].path, '/stories/s1/items/i1/version');
	assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { version_id: 'v9' });
	assert.ok(logs.some((l) => l.includes('pinned version v9')));
});

test('stories: items version clears the pin when omitted', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ ...item, version_id: null }));
	const logs = TestHelpers.captureLogs();

	await StoriesCommand.itemsVersion('s1', 'i1', undefined, {});
	assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { version_id: null });
	assert.ok(logs.some((l) => l.includes('cleared version pin')));
});
