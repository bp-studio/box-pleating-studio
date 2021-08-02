
namespace PolyBool {

	export abstract class Core {
		protected events = new EventList();

		protected abstract mergeFill(ev: Event, eve: Event): void;

		/** calculate fill flags */
		protected abstract calculateFill(ev: Event, below: Event | null, primaryPolyInverted: boolean, secondaryPolyInverted: boolean): void;

		protected calculate(primaryPolyInverted: boolean, secondaryPolyInverted: boolean): Segment[] {
			let status = new StatusList();
			let segments: Segment[] = [];

			while(!this.events.isEmpty()) {
				var ev = this.events.getHead();

				if(ev.isStart) {

					let surrounding = status.findSurrounding(ev);
					var above = surrounding.before;
					var below = surrounding.after;

					let eve = this.events.checkBothIntersections(ev, above, below);
					if(eve) {
						// ev and eve are equal; we'll keep eve and throw away ev

						// merge ev.seg's fill information into eve.seg
						this.mergeFill(ev, eve);

						this.events.remove(ev.other!);
						this.events.remove(ev);
					}

					if(this.events.getHead() !== ev) {
						// something was inserted before us in the event queue, so loop back around and
						// process it before continuing
						continue;
					}

					this.calculateFill(ev, below, primaryPolyInverted, secondaryPolyInverted);

					// insert the status and remember it for later removal
					ev.other!.status = surrounding.insert(ev);
				} else {
					let st = ev.status;

					if(st === null) {
						throw new Error('PolyBool: Zero-length segment detected; your epsilon is probably too small or too large');
					}

					// removing the status will create two new adjacent edges, so we'll need to check for those
					let i = status.getIndex(st);
					if(i > 0 && i < status.nodes.length - 1) {
						let before = status.nodes[i - 1], after = status.nodes[i + 1];
						this.events.checkIntersection(before, after);
					}

					// remove the status
					status.remove(st);

					// if we've reached this point, we've calculated everything there is to know, so save the segment for reporting
					if(!ev.primary) {
						// make sure `seg.fill` actually points to the primary polygon though
						let s = ev.seg.fill;
						ev.seg.fill = ev.seg.otherFill!;
						ev.seg.otherFill = s;
					}
					segments.push(ev.seg);
				}

				// remove the event and continue
				this.events.nodes.shift();
			}

			return segments;
		}
	}
}
