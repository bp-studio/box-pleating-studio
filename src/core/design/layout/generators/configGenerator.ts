import { Configuration } from "../configuration";
import { singleConfigGenerator } from "./singleConfigGenerator";
import { generalConfigGenerator } from "./generalConfigGenerator";

import type { JStretch } from "shared/json/pattern";
import type { ValidJunction } from "../junction/validJunction";
import type { Repository } from "../repository";

export function* configGenerator(
	repo: Repository, junctions: ValidJunction[], prototype?: JStretch
): Generator<Configuration> {

	// Process prototype
	const proto = prototype?.configuration;
	let protoSignature: string | undefined;
	const pattern = prototype?.pattern;
	if(proto && pattern) {
		try {
			const jJunctions = junctions.map(j => j.toJSON());
			const config = new Configuration(repo, jJunctions, proto.partitions, pattern);
			if(!config.$pattern) throw new Error();
			protoSignature = JSON.stringify(config.toJSON());
			yield config;
		} catch {
			console.log("Incompatible old version.");
		}
	}

	// Search for Configuration
	if(junctions.length === 1) {
		yield* singleConfigGenerator(repo, junctions[0], protoSignature);
	} else {
		yield* generalConfigGenerator(repo, junctions, protoSignature);
	}
}
