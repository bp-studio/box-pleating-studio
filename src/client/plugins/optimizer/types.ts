import type { Hierarchy } from "core/design/context/areaTree/utils";
import type { GridType, NodeId } from "shared/json";

export type LayoutMode = "view" | "random";

export interface OptimizerOptionsBase {
	layout: LayoutMode;
	/** Whether to use Basin-hopping in view-mode. */
	useBH: boolean;
	random: number;
}

export type OptimizerCommand = "buffer" | "start" | "skip" | "stop";

export interface OptimizerRequest extends OptimizerOptionsBase {
	command: OptimizerCommand;
	buffer?: Uint8Array;
	problem: {
		type: GridType;
		flaps: FlapRequest[];
		hierarchies: Hierarchy[];
	};
	vec: IPoint[] | null;
}

export interface OptimizerResult extends IDimension {
	flaps: FlapResult[];
}

interface IdModel {
	id: NodeId;
}

interface FlapRequest extends IDimension, IdModel { }
interface FlapResult extends IPoint, IdModel { }

export type OptimizerEvent = {
	[k in keyof OptimizerEventMap]: {
		event: k;
		data: OptimizerEventMap[k];
	}
}[keyof OptimizerEventMap];

interface OptimizerEventMap {
	handle: Consumer<OptimizerCommand>;
	loading: number;
	start: undefined;
	pack: number;
	candidate: [number, number];
	flap: number;
	cont: [number, number, number];
	fit: [number, number];
}
