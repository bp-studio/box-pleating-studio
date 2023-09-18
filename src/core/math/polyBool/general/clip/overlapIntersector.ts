import { GeneralIntersector } from "../generalIntersector";

//=================================================================
/**
 * {@link OverlapIntersector} is a special intersector that stops immediately
 * once an cross intersection is found.
 */
//=================================================================
export class OverlapIntersector extends GeneralIntersector {

	public $found: boolean = false;

	protected override _crossSubdivide(): void {
		// We don't really need to do anything here.
		this.$found = true;
	}
}
