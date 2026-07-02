import { access, copyFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Command } from 'commander';

/** Outcome of copying a single skill file into the destination folder. */
type InstalledFile = {
	name: string;
	action: 'created' | 'updated';
	destination: string;
};

/** Summary returned by {@link InstallCommand.install}. */
type InstallResult = {
	sourceDir: string;
	destinationDir: string;
	files: InstalledFile[];
};

/** Copy the bundled voicebox skill into an AI agent folder (e.g. `.claude`). */
export class InstallCommand {
	/** Register the `install` command on the given Commander program. */
	static register(program: Command): void {
		program
			.command('install')
			.description('Copy the bundled voicebox skill (SKILL.md) into an AI agent folder (e.g. .claude)')
			.argument('[agent-folder]', 'destination agent folder', '.')
			.action(async (agentFolder: string) => {
				await InstallCommand.run(agentFolder);
			});
	}

	/** Install the bundled skills into `agentFolder` and print the per-file outcome. */
	static async run(agentFolder: string): Promise<void> {
		const result = await InstallCommand.install(agentFolder);
		for (const file of result.files) {
			console.log(`${file.action} ${file.destination}`);
		}
		console.log(`\n${result.files.length} file(s) → ${result.destinationDir}`);
	}

	/**
	 * Copy the bundled `dotclaude_folder/skills/` tree into `agentFolder`,
	 * preserving the `skills/...` layout. Existing files are overwritten and
	 * reported as `updated`; missing files are reported as `created`.
	 *
	 * @param agentFolder Destination agent folder; the caller defaults it to `.`.
	 * @returns The bundled source directory, the resolved destination, and the per-file outcome.
	 */
	static async install(agentFolder: string): Promise<InstallResult> {
		const skillsDir = InstallCommand.bundledSkillsDir();
		if ((await InstallCommand.exists(skillsDir)) === false) {
			throw new Error(`bundled skill files not found at ${skillsDir}`);
		}
		const destinationDir = resolve(agentFolder);
		const files: InstalledFile[] = [];
		for (const relative of await InstallCommand.listFiles(skillsDir)) {
			const name = join('skills', relative);
			const destination = join(destinationDir, name);
			const alreadyThere = await InstallCommand.exists(destination);
			await mkdir(dirname(destination), { recursive: true });
			await copyFile(join(skillsDir, relative), destination);
			files.push({ name, action: alreadyThere === true ? 'updated' : 'created', destination });
		}
		return { sourceDir: skillsDir, destinationDir, files };
	}

	/**
	 * Absolute path to the bundled `dotclaude_folder/skills/` tree, resolved
	 * relative to this module so it works both from `src/` (tsx) and `dist/`.
	 */
	static bundledSkillsDir(): string {
		return fileURLToPath(new URL('../../dotclaude_folder/skills', import.meta.url));
	}

	/** Whether `path` exists (file or directory). */
	static async exists(path: string): Promise<boolean> {
		try {
			await access(path);
			return true;
		} catch {
			return false;
		}
	}

	/** Paths of every file under `dir`, relative to `dir`, recursively. */
	static async listFiles(dir: string): Promise<string[]> {
		const result: string[] = [];
		for (const entry of await readdir(dir, { withFileTypes: true })) {
			if (entry.isDirectory() === true) {
				for (const nested of await InstallCommand.listFiles(join(dir, entry.name))) {
					result.push(join(entry.name, nested));
				}
			} else {
				result.push(entry.name);
			}
		}
		return result;
	}
}
