#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { ChannelsCommand } from './commands/channels_command.js';
import { GenerateCommand } from './commands/generate_command.js';
import { HealthCommand } from './commands/health_command.js';
import { HistoryCommand } from './commands/history_command.js';
import { ModelsCommand } from './commands/models_command.js';
import { ProfilesCommand } from './commands/profiles_command.js';
import { ShutdownCommand } from './commands/shutdown_command.js';
import { SpeakCommand } from './commands/speak_command.js';
import { StoriesCommand } from './commands/stories_command.js';
import { TranscribeCommand } from './commands/transcribe_command.js';
import { WatchdogCommand } from './commands/watchdog_command.js';

/** Minimal shape of the fields read from `package.json`. */
type PackageJson = {
	version: string;
};

/** Entry point that assembles the `voicebox-cli` command tree. */
export class Cli {
	/**
	 * Build the root Commander program with every command registered.
	 *
	 * The version reported by `-V`/`--version` is read from `package.json`
	 * at runtime (resolved relative to the compiled module).
	 *
	 * @returns The configured Commander program, ready to `parseAsync`.
	 */
	static build(): Command {
		const packageJson = JSON.parse(
			readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
		) as PackageJson;

		const program = new Command();
		program
			.name('voicebox-cli')
			.description('Command-line client for the voicebox TTS API')
			.version(packageJson.version, '-V, --version', 'output the version from package.json');

		SpeakCommand.register(program);
		GenerateCommand.register(program);
		ProfilesCommand.register(program);
		ChannelsCommand.register(program);
		HistoryCommand.register(program);
		ModelsCommand.register(program);
		StoriesCommand.register(program);
		TranscribeCommand.register(program);
		HealthCommand.register(program);
		ShutdownCommand.register(program);
		WatchdogCommand.register(program);

		return program;
	}
}

Cli.build().parseAsync(process.argv).catch((error: unknown) => {
	// display the error and exit with a non-zero code so that CI/CD pipelines can detect failure
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
