import type { Command } from 'commander';
import { VoiceboxClient } from '../misc/voicebox_client.js';

type GlobalOptions = {
	baseUrl?: string;
};

export class WatchdogCommand {
	static register(program: Command): void {
		const watchdog = program
			.command('watchdog')
			.description('Control the parent-process watchdog');

		watchdog
			.command('disable')
			.description('Disable the watchdog so the server keeps running after its parent exits')
			.option('--base-url <url>', 'API base url')
			.action(async (options: GlobalOptions) => {
				await WatchdogCommand.disable(options);
			});
	}

	static async disable(options: GlobalOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);
		await client.disableWatchdog();
		console.log('watchdog disabled');
	}
}
