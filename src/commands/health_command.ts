import type { Command } from 'commander';
import { VoiceboxClient } from '../misc/voicebox_client.js';

/** Options accepted by the `health` command. */
type HealthOptions = {
	filesystem?: boolean;
	json?: boolean;
	baseUrl?: string;
};

/** Check the API health status, optionally the filesystem health. */
export class HealthCommand {
	/** Register the `health` command on the given Commander program. */
	static register(program: Command): void {
		program
			.command('health')
			.description('Check the API health status')
			.option('-f, --filesystem', 'check filesystem health instead')
			.option('--json', 'print the raw JSON response')
			.option('--base-url <url>', 'API base url')
			.action(async (options: HealthOptions) => {
				await HealthCommand.run(options);
			});
	}

	/**
	 * Query the API and print its health. With `-f/--filesystem` it reports
	 * filesystem health (disk space and per-directory status) instead of model
	 * and GPU status. With `--json` it prints the raw response and returns early.
	 */
	static async run(options: HealthOptions): Promise<void> {
		const client = new VoiceboxClient(options.baseUrl);

		if (options.filesystem === true) {
			const fs = await client.filesystemHealth();
			if (options.json === true) {
				console.log(JSON.stringify(fs, null, 2));
				return;
			}
			console.log(`filesystem: ${fs.healthy === true ? 'healthy' : 'unhealthy'}`);
			if (fs.disk_free_mb !== null && fs.disk_total_mb !== null) {
				console.log(`disk: ${Math.round(fs.disk_free_mb)} MB free / ${Math.round(fs.disk_total_mb)} MB total`);
			}
			for (const dir of fs.directories) {
				const flags = `${dir.exists === true ? 'exists' : 'missing'}, ${dir.writable === true ? 'writable' : 'read-only'}`;
				console.log(`  ${dir.path} (${flags})${dir.error !== null ? ` — ${dir.error}` : ''}`);
			}
			return;
		}

		const health = await client.health();
		if (options.json === true) {
			console.log(JSON.stringify(health, null, 2));
			return;
		}

		console.log(`status: ${health.status}`);
		console.log(`model: ${health.model_loaded === true ? 'loaded' : 'not loaded'}${health.model_size !== null ? ` (${health.model_size})` : ''}`);
		console.log(`gpu: ${health.gpu_available === true ? health.gpu_type ?? 'available' : 'unavailable'}`);
		if (health.backend_type !== null) {
			console.log(`backend: ${health.backend_type}${health.backend_variant !== null ? ` (${health.backend_variant})` : ''}`);
		}
		if (health.gpu_compatibility_warning !== null) {
			console.log(`warning: ${health.gpu_compatibility_warning}`);
		}
	}
}
