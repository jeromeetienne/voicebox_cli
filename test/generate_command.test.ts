import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GenerateCommand } from '../src/commands/generate_command.js';

type FetchCall = { url: string; method: string; body: string | undefined };

const originalFetch = globalThis.fetch;
const originalLog = console.log;
const audioBytes = new Uint8Array([1, 2, 3, 4]);

function sseCompleted(id: string): Response {
	const encoder = new TextEncoder();
	const stream = new ReadableStream<Uint8Array>({
		start(controller): void {
			controller.enqueue(encoder.encode(
				`data: {"id":"${id}","status":"completed","duration":2.5,"error":null,"source":"manual"}\n\n`,
			));
			controller.close();
		},
	});
	return new Response(stream, { status: 200 });
}

function stubApi(): FetchCall[] {
	const calls: FetchCall[] = [];
	globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input.toString();
		const method = init?.method ?? 'GET';
		const path = new URL(url).pathname;
		calls.push({ url, method, body: init?.body === undefined ? undefined : String(init.body) });

		if (path === '/generate' && method === 'POST') {
			return new Response(JSON.stringify({ id: 'g1', status: 'generating' }), { status: 200 });
		}
		if (path === '/generate/g1/retry') {
			return new Response(JSON.stringify({ id: 'g1', status: 'generating' }), { status: 200 });
		}
		if (path === '/generate/g1/cancel') {
			return new Response(null, { status: 200 });
		}
		if (path === '/generate/g1/status') {
			return sseCompleted('g1');
		}
		if (path === '/audio/g1') {
			return new Response(audioBytes, { status: 200 });
		}
		return new Response('not found', { status: 404 });
	}) as typeof fetch;
	return calls;
}

function captureLogs(): string[] {
	const lines: string[] = [];
	console.log = (...args: unknown[]): void => {
		lines.push(args.map((a) => String(a)).join(' '));
	};
	return lines;
}

afterEach(() => {
	globalThis.fetch = originalFetch;
	console.log = originalLog;
});

test('generate: run generates, downloads, and writes the audio file (wav path skips transcode)', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'vb-gen-'));
	const output = join(dir, 'out.wav');
	const calls = stubApi();
	const logs = captureLogs();

	try {
		await GenerateCommand.run('p1', 'hello world', { output, seed: 7 });

		const written = new Uint8Array(readFileSync(output));
		assert.deepEqual(written, audioBytes);

		const genCall = calls.find((c) => c.url.endsWith('/generate') && c.method === 'POST');
		assert.ok(genCall);
		assert.deepEqual(JSON.parse(String(genCall.body)), { profile_id: 'p1', text: 'hello world', seed: 7 });

		assert.ok(calls.some((c) => c.url.endsWith('/generate/g1/status')));
		assert.ok(calls.some((c) => c.url.endsWith('/audio/g1')));
		assert.ok(logs.some((l) => l.includes('queued generation g1')));
		assert.ok(logs.some((l) => l.includes(output)));
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('generate: run throws when the generation fails', async () => {
	globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
		const path = new URL(typeof input === 'string' ? input : input.toString()).pathname;
		const method = init?.method ?? 'GET';
		if (path === '/generate' && method === 'POST') {
			return new Response(JSON.stringify({ id: 'g1', status: 'generating' }), { status: 200 });
		}
		const encoder = new TextEncoder();
		const stream = new ReadableStream<Uint8Array>({
			start(controller): void {
				controller.enqueue(encoder.encode(
					'data: {"id":"g1","status":"failed","duration":0,"error":"boom","source":"manual"}\n\n',
				));
				controller.close();
			},
		});
		return new Response(stream, { status: 200 });
	}) as typeof fetch;
	captureLogs();

	await assert.rejects(
		GenerateCommand.run('p1', 'hi', { output: 'unused.wav' }),
		/generation failed: boom/,
	);
});

test('generate: retry posts to the retry endpoint and logs the new status', async () => {
	const calls = stubApi();
	const logs = captureLogs();
	await GenerateCommand.retry('g1', {});
	assert.ok(calls.some((c) => c.url.endsWith('/generate/g1/retry') && c.method === 'POST'));
	assert.ok(logs.some((l) => l.includes('retry queued g1')));
});

test('generate: cancel posts to the cancel endpoint', async () => {
	const calls = stubApi();
	const logs = captureLogs();
	await GenerateCommand.cancel('g1', {});
	assert.ok(calls.some((c) => c.url.endsWith('/generate/g1/cancel') && c.method === 'POST'));
	assert.ok(logs.some((l) => l.includes('cancelled g1')));
});

test('generate: status waits for completion and reports it', async () => {
	stubApi();
	const logs = captureLogs();
	await GenerateCommand.status('g1', {});
	assert.ok(logs.some((l) => l.includes('g1: completed') && l.includes('2.5s')));
});
