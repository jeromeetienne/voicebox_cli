import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { ChannelsCommand } from '../src/commands/channels_command.js';
import { TestHelpers } from './test_helpers.js';

afterEach(() => {
	TestHelpers.restore();
});

test('channels: create maps --device options into device_ids', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ id: 'c1', name: 'Room' }));
	TestHelpers.captureLogs();

	await ChannelsCommand.create('Room', { device: ['dev-1', 'dev-2'] });

	const createCall = calls.find((c) => c.path === '/channels' && c.method === 'POST');
	assert.deepEqual(JSON.parse(String(createCall?.body)), { name: 'Room', device_ids: ['dev-1', 'dev-2'] });
});

test('channels: update maps name and devices into the update body', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ id: 'c1', name: 'Renamed' }));
	TestHelpers.captureLogs();

	await ChannelsCommand.update('c1', { name: 'Renamed', device: ['dev-9'] });

	const putCall = calls.find((c) => c.method === 'PUT');
	assert.equal(putCall?.path, '/channels/c1');
	assert.deepEqual(JSON.parse(String(putCall?.body)), { name: 'Renamed', device_ids: ['dev-9'] });
});

test('channels: list prints one line per channel', async () => {
	TestHelpers.installFetch(() => TestHelpers.json([
		{ id: 'c1', name: 'Default', is_default: true, device_ids: [], created_at: 'x' },
	]));
	const logs = TestHelpers.captureLogs();

	await ChannelsCommand.list({});
	assert.ok(logs.some((l) => l.includes('c1') && l.includes('Default') && l.includes('default')));
});

test('channels: set-voices PUTs the profile ids', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ profile_ids: ['p1', 'p2'] }));
	TestHelpers.captureLogs();

	await ChannelsCommand.setVoices('c1', ['p1', 'p2'], {});

	const putCall = calls.find((c) => c.method === 'PUT');
	assert.equal(putCall?.path, '/channels/c1/voices');
	assert.deepEqual(JSON.parse(String(putCall?.body)), { profile_ids: ['p1', 'p2'] });
});
