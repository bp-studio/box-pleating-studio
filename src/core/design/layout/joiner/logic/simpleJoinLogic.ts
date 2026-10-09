import { JoinLogic } from "./joinLogic";
import { QV } from "../../pattern/quadrant";

import type { JoinResult } from "./joinLogic";

//=================================================================
/**
 * Simple join is the lucky case where the line of joining
 * intersects exactly on the intersection of the gadget ridges.
 * In this case, the join "just works" and no special treatment is needed.
 *
 * A special case of the simple join is when the two gadgets involved
 * have the same axis direction, which is know as the perfect join.
 */
//=================================================================
export class SimpleJoinLogic extends JoinLogic {

	public *$join(): Generator<JoinResult> {
		if(!this.data) return;
		const { pt, bv } = this.data;
		const { j1, j2 } = this;

		// Find the intersection
		const int = j1.e.$intersectLine(j2.e); // p1-perspective
		if(!int) return;

		// Check the simple join condition. Normally the ridge from the joining
		// point to the intersection must be the angle bisector of the
		// axis-parallel creases. But if the axis-parallel creases are parallel
		// (i.e. perfect joins), that ridge vanishes and the angle bisector is
		// meaningless, and instead the intersection must lie on the delta line
		// (by the diagonal principle).
		const parallel = j1.p.$direction.value.$parallel(j2.p.$direction.value);
		const onJoinLine = parallel ?
			int.$sub(this._deltaPt.value).$parallel(QV[0]) :
			int.$sub(pt).$parallel(bv);
		if(!onJoinLine) return;

		// Complete
		if(!this._setupAnchor(int)) return;
		this._setupDetour([int], [int]);
		yield this._result();
	}
}
