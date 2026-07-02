import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { InstallCommand } from '../src/commands/install_command.js';

test('install: copies the bundled skill into the target folder as created', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'voicebox-install-'));
	try {
		const result = await InstallCommand.install(dir);

		assert.ok(result.files.length > 0, 'expected at least one installed file');
		const skill = result.files.find((file) => file.name.endsWith('SKILL.md'));
		assert.ok(skill !== undefined, 'expected a SKILL.md among the installed files');
		assert.equal(skill.action, 'created');
		assert.equal(skill.name, join('skills', 'voicebox', 'SKILL.md'));

		const installed = await readFile(join(dir, 'skills', 'voicebox', 'SKILL.md'), 'utf8');
		assert.match(installed, /name: voicebox/);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});

test('install: reports updated when a file already exists', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'voicebox-install-'));
	try {
		await InstallCommand.install(dir);
		const again = await InstallCommand.install(dir);

		assert.ok(again.files.length > 0, 'expected at least one installed file');
		assert.ok(
			again.files.every((file) => file.action === 'updated'),
			'expected every file to be reported as updated on the second run',
		);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});
