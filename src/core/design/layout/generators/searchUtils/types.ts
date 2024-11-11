import type { JJunction, NodeId } from "shared/json";
import type { Configuration } from "../../configuration";

export interface JointItem {
	readonly index: number;
	readonly junction: JJunction;
	readonly oppositeNodeId: NodeId;
	readonly configs: readonly Configuration[];
	readonly split: boolean;
}
