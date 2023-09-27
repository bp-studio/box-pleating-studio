import type { GeneratorFilter } from "core/utils/generator";
import type { Configuration } from "../configuration";

export function createConfigFilter(signature: string | undefined): GeneratorFilter<Configuration> {
	return (config: Configuration): boolean | undefined => {
		if(signature === config.$signature) return;
		return config.$pattern != null;
	};
}
