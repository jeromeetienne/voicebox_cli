import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { WatchdogCommand } from '../src/commands/watchdog_command.js';
import { TestHelpers } from './test_helpers.js';

afterEach(() => {
	TestHelpers.restore();
});

test('watchdog: disable POSTs to /watchdog/disable', async () => {
	const calls = TestHelpers.installFetch(() => new Response(null, { status: 200 }));
	const logs = TestHelpers.captureLogs();

	await WatchdogCommand.disable({});
	assert.equal(calls[0].path, '/watchdog/disable');
	assert.equal(calls[0].method, 'POST');
	assert.ok(logs.some((l) => l.includes('watchdog disabled')));
});
