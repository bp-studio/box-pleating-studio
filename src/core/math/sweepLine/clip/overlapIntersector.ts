import { GeneralIntersector } from "../polyBool/generalUnion/generalIntersector";

import type { StartEvent } from "../classes/event/startEvent";

//=================================================================
/**
 * {@link OverlapIntersector} is a special intersector that stops immediately
 * once an cross intersection is found.
 */
//=================================================================
export class OverlapIntersector extends GeneralIntersector {

	public $found: boolean = false;

	public override $possibleIntersection(ev1?: StartEvent | undefined, ev2?: StartEvent | undefined): void {
		// v0.6.17: we add this check to avoid false intersection detection due to floating error,
		// which seems difficult to overcome otherwise.
		if(ev1 && ev2 && ev1.$segment.$polygon == ev2.$segment.$polygon) return;
		super.$possibleIntersection(ev1, ev2);
	}

	protected override _crossSubdivide(): void {
		// We don't really need to do anything here.
		this.$found = true;
	}
}
