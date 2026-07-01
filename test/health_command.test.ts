import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { HealthCommand } from '../src/commands/health_command.js';
import { TestHelpers } from './test_helpers.js';

afterEach(() => {
	TestHelpers.restore();
});

test('health: prints a human-readable summary from /health', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({
		status: 'healthy',
		model_loaded: true,
		model_size: '1.7B',
		gpu_available: true,
		gpu_type: 'MPS',
		backend_type: 'mlx',
		backend_variant: 'cpu',
		gpu_compatibility_warning: null,
	}));
	const logs = TestHelpers.captureLogs();

	await HealthCommand.run({});
	assert.equal(calls[0].path, '/health');
	assert.ok(logs.some((l) => l.includes('status: healthy')));
	assert.ok(logs.some((l) => l.includes('model: loaded (1.7B)')));
	assert.ok(logs.some((l) => l.includes('gpu: MPS')));
	assert.ok(logs.some((l) => l.includes('backend: mlx (cpu)')));
});

test('health: --filesystem hits /health/filesystem and lists directories', async () => {
	const calls = TestHelpers.installFetch(() => TestHelpers.json({
		healthy: true,
		disk_free_mb: 100,
		disk_total_mb: 200,
		directories: [{ path: '/data', exists: true, writable: true, error: null }],
	}));
	const logs = TestHelpers.captureLogs();

	await HealthCommand.run({ filesystem: true });
	assert.equal(calls[0].path, '/health/filesystem');
	assert.ok(logs.some((l) => l.includes('filesystem: healthy')));
	assert.ok(logs.some((l) => l.includes('100 MB free / 200 MB total')));
	assert.ok(logs.some((l) => l.includes('/data') && l.includes('exists') && l.includes('writable')));
});

test('health: --json prints raw JSON', async () => {
	TestHelpers.installFetch(() => TestHelpers.json({ status: 'healthy', model_loaded: false, gpu_available: false }));
	const logs = TestHelpers.captureLogs();

	await HealthCommand.run({ json: true });
	const parsed = JSON.parse(logs.join('\n'));
	assert.equal(parsed.status, 'healthy');
});
