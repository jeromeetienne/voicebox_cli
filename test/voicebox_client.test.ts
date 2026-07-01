import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { VoiceboxClient } from '../src/misc/voicebox_client.js';

type FetchCall = { url: string; init: RequestInit | undefined };

const originalFetch = globalThis.fetch;

function stubFetch(handler: (url: string, init: RequestInit | undefined) => Response): FetchCall[] {
	const calls: FetchCall[] = [];
	globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input.toString();
		calls.push({ url, init });
		return handler(url, init);
	}) as typeof fetch;
	return calls;
}

function sseResponse(chunks: string[]): Response {
	const encoder = new TextEncoder();
	const stream = new ReadableStream<Uint8Array>({
		start(controller): void {
			for (const chunk of chunks) {
				controller.enqueue(encoder.encode(chunk));
			}
			controller.close();
		},
	});
	return new Response(stream, { status: 200 });
}

afterEach(() => {
	globalThis.fetch = originalFetch;
});

test('trims a trailing slash from the base url', async () => {
	const calls = stubFetch(() => new Response('[]', { status: 200 }));
	await new VoiceboxClient('http://example.test/').listProfiles();
	assert.equal(calls[0].url, 'http://example.test/profiles');
});

test('listProfiles parses the JSON array', async () => {
	stubFetch(() => new Response(JSON.stringify([{ id: 'p1', name: 'Alice' }]), { status: 200 }));
	const profiles = await new VoiceboxClient('http://example.test').listProfiles();
	assert.equal(profiles.length, 1);
	assert.equal(profiles[0].name, 'Alice');
});

test('createProfile sends a JSON POST body', async () => {
	const calls = stubFetch(() => new Response(JSON.stringify({ id: 'p2', name: 'Bob' }), { status: 200 }));
	await new VoiceboxClient('http://example.test').createProfile({ name: 'Bob', language: 'fr' });

	const init = calls[0].init;
	assert.equal(calls[0].url, 'http://example.test/profiles');
	assert.equal(init?.method, 'POST');
	assert.deepEqual(init?.headers, { 'content-type': 'application/json' });
	assert.deepEqual(JSON.parse(String(init?.body)), { name: 'Bob', language: 'fr' });
});

test('generate posts the full request to /generate', async () => {
	const calls = stubFetch(() => new Response(JSON.stringify({ id: 'g1', status: 'generating' }), { status: 200 }));
	await new VoiceboxClient('http://example.test').generate({ profile_id: 'p1', text: 'hi', seed: 42 });
	assert.equal(calls[0].url, 'http://example.test/generate');
	assert.equal(calls[0].init?.method, 'POST');
	assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { profile_id: 'p1', text: 'hi', seed: 42 });
});

test('cancelGeneration POSTs to the cancel endpoint', async () => {
	const calls = stubFetch(() => new Response(null, { status: 200 }));
	await new VoiceboxClient('http://example.test').cancelGeneration('g1');
	assert.equal(calls[0].url, 'http://example.test/generate/g1/cancel');
	assert.equal(calls[0].init?.method, 'POST');
});

test('createChannel posts name and device_ids', async () => {
	const calls = stubFetch(() => new Response(JSON.stringify({ id: 'c1', name: 'Room' }), { status: 200 }));
	await new VoiceboxClient('http://example.test').createChannel('Room', ['dev-1']);
	assert.equal(calls[0].url, 'http://example.test/channels');
	assert.equal(calls[0].init?.method, 'POST');
	assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { name: 'Room', device_ids: ['dev-1'] });
});

test('setChannelVoices PUTs the profile ids', async () => {
	const calls = stubFetch(() => new Response('{}', { status: 200 }));
	await new VoiceboxClient('http://example.test').setChannelVoices('c1', ['p1', 'p2']);
	assert.equal(calls[0].url, 'http://example.test/channels/c1/voices');
	assert.equal(calls[0].init?.method, 'PUT');
	assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { profile_ids: ['p1', 'p2'] });
});

test('deleteProfile issues a DELETE request', async () => {
	const calls = stubFetch(() => new Response(null, { status: 204 }));
	await new VoiceboxClient('http://example.test').deleteProfile('p3');
	assert.equal(calls[0].url, 'http://example.test/profiles/p3');
	assert.equal(calls[0].init?.method, 'DELETE');
});

test('surfaces the status code and body on failure', async () => {
	stubFetch(() => new Response('{"detail":"Profile not found"}', { status: 404 }));
	await assert.rejects(
		new VoiceboxClient('http://example.test').getProfile('missing'),
		/failed \(404\).*Profile not found/,
	);
});

test('addProfileSample posts multipart form data', async () => {
	const calls = stubFetch(() => new Response(JSON.stringify({ id: 's1', profile_id: 'p1' }), { status: 200 }));
	await new VoiceboxClient('http://example.test').addProfileSample(
		'p1',
		{ data: new Uint8Array([1, 2, 3]), filename: 'clip.wav' },
		'hello there',
	);

	const init = calls[0].init;
	assert.equal(calls[0].url, 'http://example.test/profiles/p1/samples');
	assert.equal(init?.method, 'POST');
	assert.ok(init?.body instanceof FormData);
	assert.equal((init?.body as FormData).get('reference_text'), 'hello there');
});

test('health hits /health and parses the response', async () => {
	const calls = stubFetch(() => new Response(
		JSON.stringify({ status: 'healthy', model_loaded: true, gpu_available: false }),
		{ status: 200 },
	));
	const health = await new VoiceboxClient('http://example.test').health();
	assert.equal(calls[0].url, 'http://example.test/health');
	assert.equal(health.status, 'healthy');
	assert.equal(health.model_loaded, true);
});

test('filesystemHealth hits /health/filesystem', async () => {
	const calls = stubFetch(() => new Response(
		JSON.stringify({ healthy: true, disk_free_mb: 10, disk_total_mb: 20, directories: [] }),
		{ status: 200 },
	));
	const fs = await new VoiceboxClient('http://example.test').filesystemHealth();
	assert.equal(calls[0].url, 'http://example.test/health/filesystem');
	assert.equal(fs.healthy, true);
});

test('waitForCompletion resolves on the terminal SSE event', async () => {
	stubFetch(() => sseResponse([
		'data: {"id":"g1","status":"generating","duration":0,"error":null,"source":"manual"}\n\n',
		'data: {"id":"g1","status":"completed","duration":2.5,"error":null,"source":"manual"}\n\n',
	]));

	const status = await new VoiceboxClient('http://example.test').waitForCompletion('g1');
	assert.equal(status.status, 'completed');
	assert.equal(status.duration, 2.5);
});
