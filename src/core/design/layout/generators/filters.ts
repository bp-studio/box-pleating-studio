import type { Configuration } from "../configuration";

export const configFilter: Predicate<Configuration> =
	(config: Configuration): boolean => config.$pattern != null;
