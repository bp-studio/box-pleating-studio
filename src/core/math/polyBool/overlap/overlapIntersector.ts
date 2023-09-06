import { ClipIntersector } from "../clip/clipIntersector";

//=================================================================
/**
 * {@link OverlapIntersector} is a special intersector that stops immediately
 * once an cross intersection is found.
 */
//=================================================================
export class OverlapIntersector extends ClipIntersector {

	public $found: boolean = false;

	protected override _crossSubdivide(): void {
		// We don't really need to do anything here.
		this.$found = true;
	}
}
