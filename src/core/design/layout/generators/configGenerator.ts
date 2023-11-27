import { Configuration } from "../configuration";
import { singleConfigGenerator } from "./singleConfigGenerator";
import { generalConfigGenerator } from "./generalConfigGenerator";
import { ConfigGeneratorContext } from "./configGeneratorContext";

import type { JConfiguration, JStretch } from "shared/json/pattern";
import type { Repository } from "../repository";

export function* configGenerator(repo: Repository, prototype?: JStretch): Generator<Configuration> {

	let protoSignature: string | undefined;
	if(prototype) {
		// Recover entire set of configurations
		if(prototype.repo) {
			for(const config of prototype.repo.configurations) {
				yield new Configuration(repo, config);
			}
			return;
		}

		// Process single prototype
		const proto = prototype.configuration;
		const pattern = prototype.pattern;
		if(proto && pattern) {
			try {
				const jConfig: JConfiguration = { partitions: proto.partitions, patterns: [pattern] };
				const config = new Configuration(repo, jConfig);
				/* istanbul ignore if */
				if(!config.$pattern) throw new Error();
				protoSignature = config.$signature;
				yield config;
			} catch {
				/* istanbul ignore next */
				console.log("Incompatible old version.");
			}
		}
	}

	// Search for Configuration
	if(repo.$junctions.length === 1) {
		const context = new ConfigGeneratorContext(repo);
		yield* singleConfigGenerator(context, 0, protoSignature);
	} else {
		yield* generalConfigGenerator(repo, protoSignature);
	}
}
