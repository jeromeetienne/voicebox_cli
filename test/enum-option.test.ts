import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { InvalidArgumentError } from 'commander';
import { EnumOption } from '../src/misc/enum-option.js';
import { TestHelpers } from './test_helpers.js';

const VALUES = ['base', 'small', 'turbo'] as const;

afterEach(() => {
	TestHelpers.restore();
});

test('enum-option: appends the accepted values to the description', () => {
	const option = EnumOption.create('-m, --model <model>', 'transcription model', VALUES);
	assert.equal(
		option.description,
		"transcription model (one of: base, small, turbo; pass 'list' to see options)",
	);
});

test('enum-option: accepts a value within the set', () => {
	const option = EnumOption.create('-m, --model <model>', 'transcription model', VALUES);
	assert.equal(option.parseArg?.('turbo', undefined), 'turbo');
});

test('enum-option: rejects a value outside the set', () => {
	const option = EnumOption.create('-m, --model <model>', 'transcription model', VALUES);
	assert.throws(() => option.parseArg?.('bogus', undefined), InvalidArgumentError);
});

test("enum-option: 'list' prints every value and exits", () => {
	const option = EnumOption.create('-m, --model <model>', 'transcription model', VALUES);
	const logs = TestHelpers.captureLogs();

	const savedExit = process.exit;
	let exitCode: number | undefined;
	process.exit = ((code?: number): never => {
		exitCode = code;
		throw new Error('exit');
	}) as typeof process.exit;

	try {
		assert.throws(() => option.parseArg?.('list', undefined));
	} finally {
		process.exit = savedExit;
	}

	assert.equal(exitCode, 0);
	assert.deepEqual(logs, ['base\nsmall\nturbo']);
});

test('enum-option: applies the default value', () => {
	const option = EnumOption.create('-l, --language <code>', 'language code', VALUES, 'base');
	assert.equal(option.defaultValue, 'base');
});
