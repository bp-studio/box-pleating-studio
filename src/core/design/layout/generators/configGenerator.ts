import { Configuration } from "../configuration";
import { singleConfigGenerator } from "./singleConfigGenerator";
import { generalConfigGenerator } from "./generalConfigGenerator";

import type { JConfiguration, JStretch } from "shared/json/pattern";
import type { Junctions } from "../junction/validJunction";
import type { Repository } from "../repository";

export function* configGenerator(
	repo: Repository, junctions: Junctions, prototype?: JStretch
): Generator<Configuration> {

	let protoSignature: string | undefined;
	if(prototype) {
		const jJunctions = junctions.map(j => j.$toOrientedJSON(repo.$f));

		// Recover entire set of configurations
		if(prototype.repo) {
			for(const config of prototype.repo.configurations) {
				yield new Configuration(repo, jJunctions, config);
			}
			return;
		}

		// Process single prototype
		const proto = prototype.configuration;
		const pattern = prototype.pattern;
		if(proto && pattern) {
			try {
				const jConfig: JConfiguration = { partitions: proto.partitions, patterns: [pattern] };
				const config = new Configuration(repo, jJunctions, jConfig);
				if(!config.$pattern) throw new Error();
				protoSignature = config.$signature;
				yield config;
			} catch {
				console.log("Incompatible old version.");
			}
		}
	}

	// Search for Configuration
	if(junctions.length === 1) {
		yield* singleConfigGenerator(repo, junctions[0], protoSignature);
	} else {
		yield* generalConfigGenerator(repo, junctions, protoSignature);
	}
}
