import { Command } from 'commander';
import { Speak } from './commands/speak.js';

export class Cli {
	static build(): Command {
		const program = new Command();
		program
			.name('voicebox')
			.description('Command-line client for the voicebox TTS API')
			.version('0.1.0');

		Speak.register(program);

		return program;
	}
}

Cli.build().parseAsync(process.argv).catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
