import { Core } from "./Core";
import { Segment } from "../types";
import { Epsilon } from "../Epsilon";
import type { Path, XEvent } from "../types";

/** performing self-intersection, so deal with regions */
export class SegmentCore extends Core {
	public addRegion(region: Path): void {
		// regions are a list of points:
		//  [ [0, 0], [100, 0], [50, 100] ]
		// you can add multiple regions before running calculate
		let pt1;
		let pt2 = region[region.length - 1];
		for(let i = 0; i < region.length; i++) {
			pt1 = pt2;
			pt2 = region[i];

			let forward = Epsilon.$pointsCompare(pt1, pt2);

			// points are equal, so we have a zero-length segment; just skip it
			if(forward === 0) continue;

			this.events.addSegment(
				new Segment(
					forward < 0 ? pt1 : pt2,
					forward < 0 ? pt2 : pt1
				),
				true
			);
		}
	}

	public calculate(inverted: boolean): Segment[] {
		// is the polygon inverted?
		// returns segments
		return super.calculate(inverted, false);
	}

	protected mergeFill(ev: XEvent, eve: XEvent): void {
		let toggle; // are we a toggling edge?
		if(ev.seg.fill.below === null) toggle = true;
		else toggle = ev.seg.fill.above !== ev.seg.fill.below;

		// merge two segments that belong to the same polygon
		// think of this as sandwiching two segments together, where `eve.seg` is
		// the bottom -- this will cause the above fill flag to toggle
		if(toggle) eve.seg.fill.above = !eve.seg.fill.above;
	}

	protected calculateFill(ev: XEvent, below: XEvent | null, polyInverted1: boolean, polyInverted2: boolean): void {
		let toggle; // are we a toggling edge?
		if(ev.seg.fill.below === null) toggle = true; // if we are a new segment, then we toggle
		else toggle = ev.seg.fill.above !== ev.seg.fill.below; // we are a segment that has previous knowledge from a division, calculate toggle

		// next, calculate whether we are filled below us
		if(!below) { // if nothing is below us...
			// we are filled below us if the polygon is inverted
			ev.seg.fill.below = polyInverted1;
		} else {
			// otherwise, we know the answer -- it's the same if whatever is below
			// us is filled above it
			ev.seg.fill.below = below.seg.fill.above;
		}

		// since now we know if we're filled below us, we can calculate whether
		// we're filled above us by applying toggle to whatever is below us
		if(toggle) ev.seg.fill.above = !ev.seg.fill.below;
		else ev.seg.fill.above = ev.seg.fill.below;
	}
}
