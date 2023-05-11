import type { Configuration } from "../configuration";

export const configFilter: Func<string | undefined, Predicate<Configuration>> =
	(signature: string | undefined) =>
		(config: Configuration): boolean =>
			config.$pattern != null && (!signature || signature != JSON.stringify(config));
