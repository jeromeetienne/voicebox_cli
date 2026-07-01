#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { ProfilesCommand } from './commands/profiles_command.js';
import { SpeakCommand } from './commands/speak_command.js';

type PackageJson = {
	version: string;
};

export class Cli {
	static build(): Command {
		const packageJson = JSON.parse(
			readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
		) as PackageJson;

		const program = new Command();
		program
			.name('voicebox')
			.description('Command-line client for the voicebox TTS API')
			.version(packageJson.version, '-V, --version', 'output the version from package.json');

		SpeakCommand.register(program);
		ProfilesCommand.register(program);

		return program;
	}
}

Cli.build().parseAsync(process.argv).catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
