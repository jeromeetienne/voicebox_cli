import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { ModelsCommand } from '../src/commands/models_command.js';
import { TestHelpers } from './test_helpers.js';

afterEach(() => {
	TestHelpers.restore();
});

test('models: status prints a line per model with a count footer', async () => {
	const models = [
		{ model_name: 'qwen-1.7b', display_name: 'Qwen 1.7B', downloaded: true, loaded: true, size_mb: 1700 },
		{ model_name: 'whisper-turbo', display_name: 'Whisper Turbo', downloaded: false, size_mb: null },
	];
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ models }));
	const logs = TestHelpers.captureLogs();

	await ModelsCommand.status({});

	assert.equal(calls[0].path, '/models/status');
	assert.ok(logs.some((l) => l.includes('✓') && l.includes('qwen-1.7b') && l.includes('loaded') && l.includes('1700 MB')));
	assert.ok(logs.some((l) => l.includes('whisper-turbo')));
	assert.ok(logs.some((l) => l.includes('2 models')));
});

test('models: load passes the size as a query param', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ ok: true }));
	TestHelpers.captureLogs();

	await ModelsCommand.load('1.7B', {});

	const url = new URL(calls[0].url);
	assert.equal(url.pathname, '/models/load');
	assert.equal(url.searchParams.get('model_size'), '1.7B');
	assert.equal(calls[0].method, 'POST');
});

test('models: load without a size omits the query param', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ ok: true }));
	TestHelpers.captureLogs();

	await ModelsCommand.load(undefined, {});
	assert.equal(calls[0].url.endsWith('/models/load'), true);
});

test('models: unload without a name hits the default endpoint', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ ok: true }));
	TestHelpers.captureLogs();

	await ModelsCommand.unload(undefined, {});
	assert.equal(calls[0].path, '/models/unload');
	assert.equal(calls[0].method, 'POST');
});

test('models: unload with a name hits the per-model endpoint', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ ok: true }));
	TestHelpers.captureLogs();

	await ModelsCommand.unload('qwen-1.7b', {});
	assert.equal(calls[0].path, '/models/qwen-1.7b/unload');
	assert.equal(calls[0].method, 'POST');
});

test('models: download POSTs the model name in the body', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ ok: true }));
	TestHelpers.captureLogs();

	await ModelsCommand.download('qwen-1.7b', {});
	assert.equal(calls[0].path, '/models/download');
	assert.equal(calls[0].method, 'POST');
	assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { model_name: 'qwen-1.7b' });
});

test('models: cancel-download POSTs the model name in the body', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ ok: true }));
	TestHelpers.captureLogs();

	await ModelsCommand.cancelDownload('qwen-1.7b', {});
	assert.equal(calls[0].path, '/models/download/cancel');
	assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { model_name: 'qwen-1.7b' });
});

test('models: delete calls DELETE on the model', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ ok: true }));
	TestHelpers.captureLogs();

	await ModelsCommand.delete('qwen-1.7b', {});
	assert.equal(calls[0].path, '/models/qwen-1.7b');
	assert.equal(calls[0].method, 'DELETE');
});

test('models: cache-dir prints the response', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ cache_dir: '/home/x/.cache' }));
	const logs = TestHelpers.captureLogs();

	await ModelsCommand.cacheDir({});
	assert.equal(calls[0].path, '/models/cache-dir');
	assert.ok(logs.some((l) => l.includes('/home/x/.cache')));
});

test('models: progress streams and prints SSE events', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.sse([{ progress: 0.5 }, { progress: 1 }]));
	const logs = TestHelpers.captureLogs();

	await ModelsCommand.progress('qwen-1.7b', {});
	assert.equal(calls[0].path, '/models/progress/qwen-1.7b');
	assert.ok(logs.some((l) => l.includes('0.5')));
	assert.ok(logs.some((l) => l.includes('"progress":1')));
});

test('models: download-wait starts the download, shows progress, waits for completion', async () => {
	let statusCalls = 0;
	const calls = TestHelpers.installFetch((path) => {
		if (path === '/models/status') {
			statusCalls += 1;
			const downloaded = statusCalls > 1;
			return TestHelpers.json({
				models: [{ model_name: 'whisper-small', display_name: 'Whisper Small', downloaded, size_mb: downloaded ? 922 : null }],
			});
		}
		if (path === '/models/download') {
			return TestHelpers.json({ message: 'started' });
		}
		return TestHelpers.sse([
			{ current: 0, total: 1000, progress: 0, filename: 'model.safetensors', status: 'downloading' },
			{ current: 1000, total: 1000, progress: 100, filename: 'model.safetensors', status: 'downloading' },
		]);
	});
	const logs = TestHelpers.captureLogs();

	await ModelsCommand.downloadWait('whisper-small', {});

	assert.ok(calls.some((c) => c.path === '/models/download' && c.method === 'POST'));
	assert.ok(calls.some((c) => c.path === '/models/progress/whisper-small'));
	assert.ok(logs.some((l) => l.includes('whisper-small: 100%')));
	assert.ok(logs.some((l) => l.includes('✓ whisper-small downloaded')));
});

test('models: download-wait skips the download when already present', async () => {
	const calls = TestHelpers.installFetch(() =>
		TestHelpers.json({ models: [{ model_name: 'whisper-small', display_name: 'Whisper Small', downloaded: true, size_mb: 922 }] }),
	);
	const logs = TestHelpers.captureLogs();

	await ModelsCommand.downloadWait('whisper-small', {});

	assert.equal(calls.length, 1);
	assert.equal(calls[0].path, '/models/status');
	assert.ok(logs.some((l) => l.includes('already downloaded')));
});

test('models: migrate POSTs the destination and streams events', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.sse([{ status: 'copying' }, { status: 'done' }]));
	const logs = TestHelpers.captureLogs();

	await ModelsCommand.migrate('/new/dir', {});
	assert.equal(calls[0].path, '/models/migrate');
	assert.equal(calls[0].method, 'POST');
	assert.deepEqual(JSON.parse(calls[0].body ?? '{}'), { destination: '/new/dir' });
	assert.ok(logs.some((l) => l.includes('done')));
});

test('models: migrate-progress streams the migration progress', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.sse([{ status: 'copying' }]));
	const logs = TestHelpers.captureLogs();

	await ModelsCommand.migrateProgress({});
	assert.equal(calls[0].path, '/models/migrate/progress');
	assert.ok(logs.some((l) => l.includes('copying')));
});
