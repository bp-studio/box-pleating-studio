
namespace PolyBool {

	interface Fill {
		above: boolean | null;
		below: boolean | null;
	}

	/** An edge in the polygon. */
	export class Segment {

		public start: Point;
		public end: Point;
		public fill: Fill = {
			above: null,
			below: null,
		};
		public otherFill: Fill | null = null;

		constructor(start: Point, end: Point, fill?: Fill) {
			this.start = start;
			this.end = end;
			if(fill) {
				this.fill = {
					above: fill.above,
					below: fill.below,
				};
			}
		}

		public copy(start: Point = this.start): Segment {
			return new Segment(start, this.end, this.fill);
		}
	}
}
