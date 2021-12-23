import { Core } from "./Core";
import type { Segment, XEvent } from "../types";

/** performing combination of polygons, so only deal with already-processed segments */
export class CombineCore extends Core {

	public combine(segments1: Segment[], inverted1: boolean, segments2: Segment[], inverted2: boolean): Segment[] {
		// segmentsX come from the self-intersection API, or this API
		// invertedX is whether we treat that list of segments as an inverted polygon or not
		// returns segments that can be used for further operations
		segments1.forEach((seg: Segment) => this.events.addSegment(seg.copy(), true));
		segments2.forEach((seg: Segment) => this.events.addSegment(seg.copy(), false));
		return this.calculate(inverted1, inverted2);
	}

	protected mergeFill(ev: XEvent, eve: XEvent): void {
		// merge two segments that belong to different polygons
		// each segment has distinct knowledge, so no special logic is needed
		// note that this can only happen once per segment in this phase, because we
		// are guaranteed that all self-intersections are gone
		eve.seg.otherFill = ev.seg.fill;
	}

	protected calculateFill(ev: XEvent, below: XEvent | null, polyInverted1: boolean, polyInverted2: boolean): void {
		// now we fill in whatever missing transition information, since we are all-knowing
		// at this point

		if(ev.seg.otherFill === null) {
			// if we don't have other information, then we need to figure out if we're
			// inside the other polygon
			let inside;
			if(!below) {
				// if nothing is below us, then we're inside if the other polygon is
				// inverted
				inside = ev.primary ? polyInverted2 : polyInverted1;
			} else { // otherwise, something is below us
				// so copy the below segment's other polygon's above
				inside = ev.primary === below.primary ? below.seg.otherFill!.above : below.seg.fill.above;
			}
			ev.seg.otherFill = {
				above: inside,
				below: inside,
			};
		}
	}
}
