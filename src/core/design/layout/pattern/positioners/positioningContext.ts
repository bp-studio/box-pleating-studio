import type { Repository } from "../../repository";
import type { JJunctions } from "shared/json";
import type { Device } from "../device";

export interface PositioningContext {
	repo: Repository;
	junctions: JJunctions;
	devices: readonly Device[];
}
