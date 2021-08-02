
namespace PolyBool {

	// performing self-intersection, so deal with regions
	export class SegmentCore extends Core {
		public addRegion(region: Path) {
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

		public calculate(inverted: boolean) {
			// is the polygon inverted?
			// returns segments
			return super.calculate(inverted, false);
		}

		protected mergeFill(ev: Event, eve: Event): void {
			var toggle; // are we a toggling edge?
			if(ev.seg.fill.below === null) toggle = true;
			else toggle = ev.seg.fill.above !== ev.seg.fill.below;

			// merge two segments that belong to the same polygon
			// think of this as sandwiching two segments together, where `eve.seg` is
			// the bottom -- this will cause the above fill flag to toggle
			if(toggle) eve.seg.fill.above = !eve.seg.fill.above;
		}

		protected calculateFill(ev: Event, below: Event | null, primaryPolyInverted: boolean, secondaryPolyInverted: boolean) {
			var toggle; // are we a toggling edge?
			if(ev.seg.fill.below === null) // if we are a new segment...
			{ toggle = true; } // then we toggle
			else // we are a segment that has previous knowledge from a division
			{ toggle = ev.seg.fill.above !== ev.seg.fill.below; } // calculate toggle

			// next, calculate whether we are filled below us
			if(!below) { // if nothing is below us...
				// we are filled below us if the polygon is inverted
				ev.seg.fill.below = primaryPolyInverted;
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
}
