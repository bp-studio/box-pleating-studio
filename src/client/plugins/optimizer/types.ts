import type { DistMap } from "core/design/context/treeUtils";
import type { GridType } from "shared/json";

export type LayoutMode = "view" | "random";
export type FittingMode = "quick" | "full";

export interface OptimizerOptionsBase {
	layout: LayoutMode;
	/** Whether to use Basin-hopping in view-mode. */
	useBH: boolean;
	fit: FittingMode;
	random: number;
}

export type OptimizerCommand = "buffer" | "start" | "skip" | "stop";

export interface OptimizerRequest extends OptimizerOptionsBase {
	command: OptimizerCommand;
	buffer?: Uint8Array;
	problem: {
		type: GridType;
		flaps: IDimension[];
		distMap: DistMap<number>;
	};
	vec: IPoint[] | null;
}

export interface OptimizerResult extends IDimension {
	flaps: IPoint[];
}

export type OptimizerEvent = {
	[k in keyof OptimizerEventMap]: {
		event: k;
		data: OptimizerEventMap[k];
	}
}[keyof OptimizerEventMap];

interface OptimizerEventMap {
	handle: Consumer<OptimizerCommand>;
	loading: number;
	candidate: number;
	flap: number;
	bh: number;
	bhs: number;
	grid: number;
	greedy: number;
	fit: number[];
}
