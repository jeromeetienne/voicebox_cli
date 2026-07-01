export type FetchCall = {
	url: string;
	path: string;
	method: string;
	body: string | undefined;
};

export type FetchHandler = (path: string, method: string, init: RequestInit | undefined) => Response;

let savedFetch: typeof globalThis.fetch | undefined;
let savedLog: typeof console.log | undefined;

export class TestHelpers {
	static installFetch(handler: FetchHandler): FetchCall[] {
		if (savedFetch === undefined) {
			savedFetch = globalThis.fetch;
		}
		const calls: FetchCall[] = [];
		globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
			const url = typeof input === 'string' ? input : input.toString();
			const path = new URL(url).pathname;
			const method = init?.method ?? 'GET';
			calls.push({ url, path, method, body: init?.body === undefined ? undefined : String(init.body) });
			return handler(path, method, init);
		}) as typeof fetch;
		return calls;
	}

	static captureLogs(): string[] {
		if (savedLog === undefined) {
			savedLog = console.log;
		}
		const lines: string[] = [];
		console.log = (...args: unknown[]): void => {
			lines.push(args.map((a) => String(a)).join(' '));
		};
		return lines;
	}

	static restore(): void {
		if (savedFetch !== undefined) {
			globalThis.fetch = savedFetch;
			savedFetch = undefined;
		}
		if (savedLog !== undefined) {
			console.log = savedLog;
			savedLog = undefined;
		}
	}

	static json(body: unknown, status = 200): Response {
		return new Response(JSON.stringify(body), { status });
	}

	static sse(events: object[], status = 200): Response {
		const encoder = new TextEncoder();
		const stream = new ReadableStream<Uint8Array>({
			start(controller): void {
				for (const event of events) {
					controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
				}
				controller.close();
			},
		});
		return new Response(stream, { status });
	}
}
