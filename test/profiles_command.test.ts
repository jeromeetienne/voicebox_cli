import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { ProfilesCommand } from '../src/commands/profiles_command.js';
import { TestHelpers } from './test_helpers.js';

afterEach(() => {
	TestHelpers.restore();
});

const currentProfile = {
	id: 'p1',
	name: 'Narrator',
	description: 'old description',
	language: 'fr',
	voice_type: 'cloned',
	preset_engine: null,
	preset_voice_id: null,
	design_prompt: null,
	default_engine: 'qwen',
	personality: 'calm',
	sample_count: 2,
};

test('profiles: create maps CLI options to the create body', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({ id: 'p9', name: 'Bob' }));
	TestHelpers.captureLogs();

	await ProfilesCommand.create('Bob', { language: 'en', personality: 'chirpy', description: 'a voice' });

	const createCall = calls.find((c) => c.path === '/profiles' && c.method === 'POST');
	assert.deepEqual(JSON.parse(String(createCall?.body)), {
		name: 'Bob',
		description: 'a voice',
		language: 'en',
		personality: 'chirpy',
	});
});

test('profiles: update merges provided fields with the current profile', async () => {
	const calls = TestHelpers.installFetch((path, method) => {
		if (path === '/profiles/p1' && method === 'GET') {
			return TestHelpers.json(currentProfile);
		}
		return TestHelpers.json({ ...currentProfile, personality: 'grumpy' });
	});
	TestHelpers.captureLogs();

	await ProfilesCommand.update('p1', { personality: 'grumpy' });

	const putCall = calls.find((c) => c.method === 'PUT');
	const body = JSON.parse(String(putCall?.body));
	assert.equal(body.personality, 'grumpy');
	assert.equal(body.language, 'fr');
	assert.equal(body.description, 'old description');
	assert.equal(body.name, 'Narrator');
	assert.equal(body.default_engine, 'qwen');
});

test('profiles: list prints one line per profile', async () => {
	TestHelpers.installFetch(() => TestHelpers.json([currentProfile]));
	const logs = TestHelpers.captureLogs();

	await ProfilesCommand.list({});
	assert.ok(logs.some((l) => l.includes('p1') && l.includes('Narrator') && l.includes('2 samples')));
});

test('profiles: delete calls DELETE', async () => {
	const calls = TestHelpers.installFetch(() => new Response(null, { status: 204 }));
	TestHelpers.captureLogs();

	await ProfilesCommand.delete('p1', {});
	assert.equal(calls[0].path, '/profiles/p1');
	assert.equal(calls[0].method, 'DELETE');
});
