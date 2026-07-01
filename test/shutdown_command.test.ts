import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { ShutdownCommand } from '../src/commands/shutdown_command.js';
import { TestHelpers } from './test_helpers.js';

afterEach(() => {
	TestHelpers.restore();
});

test('shutdown: refuses to run without --yes and does not call the API', async () => {
	const calls = TestHelpers.installFetch(() => new Response(null, { status: 200 }));
	await assert.rejects(ShutdownCommand.run({}), /--yes/);
	assert.equal(calls.length, 0);
});

test('shutdown: POSTs to /shutdown when confirmed with --yes', async () => {
	const calls = TestHelpers.installFetch(() => new Response(null, { status: 200 }));
	const logs = TestHelpers.captureLogs();
	await ShutdownCommand.run({ yes: true });
	assert.equal(calls.length, 1);
	assert.equal(calls[0].path, '/shutdown');
	assert.equal(calls[0].method, 'POST');
	assert.ok(logs.some((l) => l.includes('shutdown requested')));
});
