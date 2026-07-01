import { Command } from 'commander';
import { ProfilesCommand } from './commands/profiles_command.js';
import { SpeakCommand } from './commands/speak_command.js';

export class Cli {
	static build(): Command {
		const program = new Command();
		program
			.name('voicebox')
			.description('Command-line client for the voicebox TTS API')
			.version('0.1.0');

		SpeakCommand.register(program);
		ProfilesCommand.register(program);

		return program;
	}
}

Cli.build().parseAsync(process.argv).catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
