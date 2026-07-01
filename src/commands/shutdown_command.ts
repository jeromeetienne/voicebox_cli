import type { Command } from 'commander';
import { VoiceboxClient } from '../misc/voicebox_client.js';

/** Options for the `shutdown` command. */
type ShutdownOptions = {
	yes?: boolean;
	baseUrl?: string;
};

/** Gracefully shut down the API server. */
export class ShutdownCommand {
	/** Register the `shutdown` command on the given Commander program. */
	static register(program: Command): void {
		program
			.command('shutdown')
			.description('Gracefully shut down the API server')
			.option('-y, --yes', 'skip the confirmation prompt')
			.option('--base-url <url>', 'API base url')
			.action(async (options: ShutdownOptions) => {
				await ShutdownCommand.run(options);
			});
	}

	/** Refuse to proceed and throw unless `options.yes` is true, then POST the shutdown request. */
	static async run(options: ShutdownOptions): Promise<void> {
		if (options.yes !== true) {
			throw new Error('refusing to shut down without confirmation; pass --yes to proceed');
		}

		const client = new VoiceboxClient(options.baseUrl);
		await client.shutdown();
		console.log('shutdown requested');
	}
}
