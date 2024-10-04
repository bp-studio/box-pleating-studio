import type { DistMap } from "core/design/context/treeUtils";
import type { GridType } from "shared/json";

export type LayoutMode = "view" | "random";
export type FittingMode = "quick" | "full";

export interface OptimizerOptionsBase {
	layout: LayoutMode;
	fit: FittingMode;
	random: number;
}

export type OptimizerCommand = "start" | "skip" | "stop";

export interface OptimizerRequest extends OptimizerOptionsBase {
	command: OptimizerCommand;
	flaps: IDimension[];
	type: GridType;
	vec: IPoint[] | null;
	distMap: DistMap<number>;
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
	candidate: number;
	flap: number;
	bh: number;
	bhs: number;
	grid: number;
	greedy: number;
	fit: number[];
}
