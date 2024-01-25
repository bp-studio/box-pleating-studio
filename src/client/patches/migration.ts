import { GridType } from "shared/json";
import { options } from "client/options";

import type { JProject } from "shared/json";

interface IMigration {
	/**
	 * The action of migration (modifies project in place).
	 * Returns true when there is a deprecated format.
	 */
	(project: Pseudo<JProject>): boolean;
}

//=================================================================
/**
 * {@link Migration} manages changes in file format versions,
 * in order to have downward compatibility.
 */
//=================================================================

export namespace Migration {

	const migrations: [IMigration, string][] = [];

	export function $add(migration: IMigration, version: string): void {
		migrations.push([migration, version]);
	}

	export function $getCurrentVersion(): string {
		return migrations[migrations.length - 1][1];
	}

	export function $getSample(): JProject {
		return {
			version: $getCurrentVersion(),
			design: {
				title: "",
				mode: "tree",
				layout: {
					sheet: { type: GridType.rectangular, width: 16, height: 16 },
					flaps: [],
					stretches: [],
				},
				tree: {
					sheet: { type: GridType.rectangular, width: 20, height: 20 },
					nodes: [],
					edges: [],
				},
			},
		};
	}

	export function $process(proj: Pseudo<JProject>): JProject {
		let deprecate = false;
		let i = $getVersionIndex(proj);
		while(i < migrations.length) {
			console.info("Applying migration " + migrations[i][1]);
			deprecate = migrations[i][0](proj) || deprecate; // Ordering matters
			i++;
		}
		proj.version = $getCurrentVersion();

		const callback = options.onDeprecate;
		/* istanbul ignore next: legacy code */
		if(callback && deprecate) callback(proj.design!.title);
		return proj as JProject;
	}

	/** Decide the starting point of migration. */
	export function $getVersionIndex(proj: Pseudo<JProject>): number {
		let i = 0;
		if("version" in proj) {
			i = migrations.findIndex(m => m[1] == proj.version) + 1;
			if(i == 0) throw new Error("Unrecognized version");
		}
		return i;
	}
}
