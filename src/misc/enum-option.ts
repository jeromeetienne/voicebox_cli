import { InvalidArgumentError, Option } from 'commander';

/** Build Commander options whose value must belong to a fixed set. */
export class EnumOption {
	/**
	 * Create an Option restricted to `values`. The accepted values are appended
	 * to the help text. Passing the literal `list` as the value prints every
	 * accepted value and exits; any other value outside the set raises a
	 * Commander error.
	 */
	static create(
		flags: string,
		description: string,
		values: readonly string[],
		defaultValue?: string,
	): Option {
		const option = new Option(
			flags,
			`${description} (one of: ${values.join(', ')}; pass 'list' to see options)`,
		);
		option.argParser((value: string): string => {
			if (value === 'list') {
				console.log(`Accepted values for ${option.name()} (${values.length}):`);
				for (const accepted of values) {
					console.log(`  ${accepted}`);
				}
				process.exit(0);
			}
			if (values.includes(value) === false) {
				throw new InvalidArgumentError(
					`invalid value '${value}'. Pass 'list' to see the ${values.length} accepted values.`,
				);
			}
			return value;
		});
		if (defaultValue !== undefined) {
			option.default(defaultValue);
		}
		return option;
	}
}
