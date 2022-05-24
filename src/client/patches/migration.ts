import { GridType } from "shared/json";

import type { JProject } from "shared/json";

interface IMigration {
	/**
	 * 執行 Migration 的動作（原地修改傳入的 project）。
	 * 傳回 true 表示有 deprecated 的格式發生。
	 */
	(project: Pseudo<JProject>): boolean;
}

//=================================================================
/**
 * {@link Migration} 負責處理不同版本的檔案格式的遷移，以求向下相容。
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
		// 判斷移轉的起點
		let i = 0;
		if("version" in proj) {
			i = migrations.findIndex(m => m[1] == proj.version) + 1;
			if(i == 0) throw new Error("Unrecognized version");
		}

		// 進行移轉
		let deprecate = false;
		while(i < migrations.length) {
			console.info("Applying migration " + migrations[i][1]);
			deprecate ||= migrations[i][0](proj);
			i++;
		}
		proj.version = $getCurrentVersion();

		if(deprecate) $onDeprecate?.(proj.design!.title);
		return proj as JProject;
	}

	/** 偵測到棄用格式的事件 callback */
	export let $onDeprecate: (title?: string) => void;
}
