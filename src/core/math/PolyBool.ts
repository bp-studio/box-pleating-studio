
//////////////////////////////////////////////////////////////////
/**
 * 本檔案的程式碼是從 https://github.com/velipso/polybooljs/issues/23
 * 裡面的一個加速版本的 polybooljs 改造成 TypeScript 版本得到的。
 *
 * polybooljs 是根據 Martinez-Rueda-Feito 演算法（2008）實作的超高速多邊形布林運算函式庫，
 * 執行上比 paper.js 的多邊形布林運算至少快了三倍。
 *
 * 由於我不需要 union, difference, xor 以外的其它運算，也不需要 buildLog，
 * 我把那些沒用到的部份都刪除掉以節省大小。
 */
//////////////////////////////////////////////////////////////////

interface Polygon {
	regions: PolyBool.Point[][];
	inverted: boolean;
}

namespace PolyBool {

	export type Point = [number, number];
	export type Path = Point[];

	export function compare(seg1: Segments, seg2: Segments): boolean {
		if(!seg1 && seg2) return false;
		let comb = combine(seg1, seg2);
		return selectXor(comb).segments.length == 0;
	}

	export function union(segments: Segments[]): Segments {
		let seg = segments[0];
		for(let i = 1; i < segments.length; i++) {
			let comb = combine(seg, segments[i]);
			seg = selectUnion(comb);
		}
		return seg;
	}

	export function difference(seg1: Segments, seg2: Segments): Segments {
		let comb = combine(seg1, seg2);
		return selectDifference(comb);
	}

	export interface Segments {
		segments: Segment[];
		inverted: boolean;
	}

	interface Combined {
		combined: Segment[];
		inverted1: boolean;
		inverted2: boolean;
	}

	interface Segment {
		start: Point;
		end: Point;
		myFill: {
			above: any;
			below: any;
		};
		otherFill: any
	}

	type compare = 0 | 1 | -1;

	export function segments(poly: Polygon): Segments {
		var i = Intersecter(true);
		poly.regions.forEach(i.addRegion!);
		return {
			segments: i.calculate!(poly.inverted),
			inverted: poly.inverted
		};
	}

	function combine(segments1: Segments, segments2: Segments) {
		var i3 = Intersecter(false);
		return {
			combined: i3.combine!(
				segments1.segments, segments1.inverted,
				segments2.segments, segments2.inverted
			),
			inverted1: segments1.inverted,
			inverted2: segments2.inverted
		};
	}

	function selectUnion(combined: Combined): Segments {
		return {
			segments: SegmentSelector.union(combined.combined),
			inverted: combined.inverted1 || combined.inverted2
		}
	}

	function selectDifference(combined: Combined): Segments {
		return {
			segments: SegmentSelector.difference(combined.combined),
			inverted: combined.inverted1 && !combined.inverted2
		}
	}

	function selectXor(combined: Combined) {
		return {
			segments: SegmentSelector.xor(combined.combined),
			inverted: combined.inverted1 !== combined.inverted2
		}
	}

	export function polygon(segments: Segments): Polygon {
		return {
			regions: SegmentChainer(segments.segments),
			inverted: segments.inverted
		};
	}

	interface Node {
		remove?: any;
	}

	interface Event extends Node {
		isStart: boolean;
		pt: Point
		seg: Segment;
		primary: boolean;
		other: Event;
		status: any;
	}

	interface Status extends Node {
		ev: Event;
	}

	function Intersecter(selfIntersection: boolean) {
		// selfIntersection is true/false depending on the phase of the overall algorithm

		//
		// segment creation
		//

		function segmentNew(start: Point, end: Point): Segment {
			return {
				start: start,
				end: end,
				myFill: {
					above: null, // is there fill above us?
					below: null  // is there fill below us?
				},
				otherFill: null
			};
		}

		function segmentCopy(start: Point, end: Point, seg: Segment): Segment {
			return {
				start: start,
				end: end,
				myFill: {
					above: seg.myFill.above,
					below: seg.myFill.below
				},
				otherFill: null
			};
		}

		//
		// event logic
		//

		var event_list = List.create<Event>();

		function eventCompare(
			p1_isStart: boolean, p1_1: Point, p1_2: Point,
			p2_isStart: boolean, p2_1: Point, p2_2: Point
		): compare {
			// compare the selected points first
			var comp = Epsilon.pointsCompare(p1_1, p2_1);
			if(comp !== 0) return comp;	// the selected points are the same

			if(Epsilon.pointsSame(p1_2, p2_2)) // if the non-selected points are the same too...
				return 0; // then the segments are equal

			if(p1_isStart !== p2_isStart) // if one is a start and the other isn't...
				return p1_isStart ? 1 : -1; // favor the one that isn't the start

			// otherwise, we'll have to calculate which one is below the other manually
			return Epsilon.pointAboveOrOnLine(p1_2,
				p2_isStart ? p2_1 : p2_2, // order matters
				p2_isStart ? p2_2 : p2_1
			) ? 1 : -1;
		}

		function eventAdd(ev: Event, other_pt: Point) {
			event_list.insertBefore(ev, function(here) {
				// should ev be inserted before here?
				if(here === ev) return 0;
				var comp = eventCompare(
					ev.isStart, ev.pt, other_pt,
					here.isStart, here.pt, here.other.pt
				);
				return comp;
			});
		}

		function eventAddSegmentStart(seg: Segment, primary: boolean) {
			var ev_start = List.node<Event>({
				isStart: true,
				pt: seg.start,
				seg: seg,
				primary: primary,
				other: null as any,
				status: null
			});
			eventAdd(ev_start, seg.end);
			return ev_start;
		}

		function eventAddSegmentEnd(ev_start: Event, seg: Segment, primary: boolean) {
			var ev_end = List.node<Event>({
				isStart: false,
				pt: seg.end,
				seg: seg,
				primary: primary,
				other: ev_start,
				status: null
			});
			ev_start.other = ev_end;
			eventAdd(ev_end, ev_start.pt);
		}

		function eventAddSegment(seg: Segment, primary: boolean) {
			var ev_start = eventAddSegmentStart(seg, primary);
			eventAddSegmentEnd(ev_start, seg, primary);
			return ev_start;
		}

		function eventUpdateEnd(ev: Event, end: Point) {
			// slides an end backwards
			//   (start)------------(end)    to:
			//   (start)---(end)

			ev.other.remove();
			ev.seg.end = end;
			ev.other.pt = end;
			eventAdd(ev.other, ev.pt);
		}

		function eventDivide(ev: Event, pt: Point) {
			var ns = segmentCopy(pt, ev.seg.end, ev.seg);
			eventUpdateEnd(ev, pt);
			return eventAddSegment(ns, ev.primary);
		}

		function calculate(primaryPolyInverted: boolean, secondaryPolyInverted: boolean): Segment[] {
			// if selfIntersection is true then there is no secondary polygon, so that isn't used

			//
			// status logic
			//

			var status_list = List.create<Status>();

			function statusCompare(ev1: Event, ev2: Event) {
				var a1 = ev1.seg.start;
				var a2 = ev1.seg.end;
				var b1 = ev2.seg.start;
				var b2 = ev2.seg.end;

				if(Epsilon.pointsCollinear(a1, b1, b2)) {
					if(Epsilon.pointsCollinear(a2, b1, b2))
						return 1;//eventCompare(true, a1, a2, true, b1, b2);
					return Epsilon.pointAboveOrOnLine(a2, b1, b2) ? 1 : -1;
				}
				return Epsilon.pointAboveOrOnLine(a1, b1, b2) ? 1 : -1;
			}

			function statusFindSurrounding(ev: Event) {
				return status_list.findTransition({ ev: ev }, function(here) {
					if(here.ev === ev) return 0;
					var comp = statusCompare(ev, here.ev);
					return -comp;
				});
			}

			function checkIntersection(ev1: Event, ev2: Event) {
				// returns the segment equal to ev1, or false if nothing equal

				var seg1 = ev1.seg;
				var seg2 = ev2.seg;
				var a1 = seg1.start;
				var a2 = seg1.end;
				var b1 = seg2.start;
				var b2 = seg2.end;

				var i = Epsilon.linesIntersect(a1, a2, b1, b2);

				if(i === false) {
					// segments are parallel or coincident

					// if points aren't collinear, then the segments are parallel, so no intersections
					if(!Epsilon.pointsCollinear(a1, a2, b1))
						return false;
					// otherwise, segments are on top of each other somehow (aka coincident)

					if(Epsilon.pointsSame(a1, b2) || Epsilon.pointsSame(a2, b1))
						return false; // segments touch at endpoints... no intersection

					var a1_equ_b1 = Epsilon.pointsSame(a1, b1);
					var a2_equ_b2 = Epsilon.pointsSame(a2, b2);

					if(a1_equ_b1 && a2_equ_b2)
						return ev2; // segments are exactly equal

					var a1_between = !a1_equ_b1 && Epsilon.pointBetween(a1, b1, b2);
					var a2_between = !a2_equ_b2 && Epsilon.pointBetween(a2, b1, b2);

					// handy for debugging:
					// buildLog.log({
					//	a1_equ_b1: a1_equ_b1,
					//	a2_equ_b2: a2_equ_b2,
					//	a1_between: a1_between,
					//	a2_between: a2_between
					// });

					if(a1_equ_b1) {
						if(a2_between) {
							//  (a1)---(a2)
							//  (b1)----------(b2)
							eventDivide(ev2, a2);
						}
						else {
							//  (a1)----------(a2)
							//  (b1)---(b2)
							eventDivide(ev1, b2);
						}
						return ev2;
					}
					else if(a1_between) {
						if(!a2_equ_b2) {
							// make a2 equal to b2
							if(a2_between) {
								//         (a1)---(a2)
								//  (b1)-----------------(b2)
								eventDivide(ev2, a2);
							}
							else {
								//         (a1)----------(a2)
								//  (b1)----------(b2)
								eventDivide(ev1, b2);
							}
						}

						//         (a1)---(a2)
						//  (b1)----------(b2)
						eventDivide(ev2, a1);
					}
				}
				else {
					// otherwise, lines intersect at i.pt, which may or may not be between the endpoints

					// is A divided between its endpoints? (exclusive)
					if(i.alongA === 0) {
						if(i.alongB === -1) // yes, at exactly b1
							eventDivide(ev1, b1);
						else if(i.alongB === 0) // yes, somewhere between B's endpoints
							eventDivide(ev1, i.pt);
						else if(i.alongB === 1) // yes, at exactly b2
							eventDivide(ev1, b2);
					}

					// is B divided between its endpoints? (exclusive)
					if(i.alongB === 0) {
						if(i.alongA === -1) // yes, at exactly a1
							eventDivide(ev2, a1);
						else if(i.alongA === 0) // yes, somewhere between A's endpoints (exclusive)
							eventDivide(ev2, i.pt);
						else if(i.alongA === 1) // yes, at exactly a2
							eventDivide(ev2, a2);
					}
				}
				return false;
			}

			//
			// main event loop
			//
			var segments: Segment[] = [];
			while(!event_list.isEmpty()) {
				var ev = event_list.getHead();

				if(ev.isStart) {

					var surrounding = statusFindSurrounding(ev);
					var above = surrounding.before ? surrounding.before.ev : null;
					var below = surrounding.after ? surrounding.after.ev : null;

					function checkBothIntersections() {
						if(above) {
							var eve = checkIntersection(ev, above);
							if(eve)
								return eve;
						}
						if(below)
							return checkIntersection(ev, below);
						return false;
					}

					var eve = checkBothIntersections();
					if(eve) {
						// ev and eve are equal
						// we'll keep eve and throw away ev

						// merge ev.seg's fill information into eve.seg

						if(selfIntersection) {
							var toggle; // are we a toggling edge?
							if(ev.seg.myFill.below === null)
								toggle = true;
							else
								toggle = ev.seg.myFill.above !== ev.seg.myFill.below;

							// merge two segments that belong to the same polygon
							// think of this as sandwiching two segments together, where `eve.seg` is
							// the bottom -- this will cause the above fill flag to toggle
							if(toggle)
								eve.seg.myFill.above = !eve.seg.myFill.above;
						}
						else {
							// merge two segments that belong to different polygons
							// each segment has distinct knowledge, so no special logic is needed
							// note that this can only happen once per segment in this phase, because we
							// are guaranteed that all self-intersections are gone
							eve.seg.otherFill = ev.seg.myFill;
						}

						ev.other.remove();
						ev.remove();
					}

					if(event_list.getHead() !== ev) {
						// something was inserted before us in the event queue, so loop back around and
						// process it before continuing
						continue;
					}

					//
					// calculate fill flags
					//
					if(selfIntersection) {
						var toggle; // are we a toggling edge?
						if(ev.seg.myFill.below === null) // if we are a new segment...
							toggle = true; // then we toggle
						else // we are a segment that has previous knowledge from a division
							toggle = ev.seg.myFill.above !== ev.seg.myFill.below; // calculate toggle

						// next, calculate whether we are filled below us
						if(!below) { // if nothing is below us...
							// we are filled below us if the polygon is inverted
							ev.seg.myFill.below = primaryPolyInverted;
						}
						else {
							// otherwise, we know the answer -- it's the same if whatever is below
							// us is filled above it
							ev.seg.myFill.below = below.seg.myFill.above;
						}

						// since now we know if we're filled below us, we can calculate whether
						// we're filled above us by applying toggle to whatever is below us
						if(toggle)
							ev.seg.myFill.above = !ev.seg.myFill.below;
						else
							ev.seg.myFill.above = ev.seg.myFill.below;
					}
					else {
						// now we fill in any missing transition information, since we are all-knowing
						// at this point

						if(ev.seg.otherFill === null) {
							// if we don't have other information, then we need to figure out if we're
							// inside the other polygon
							var inside;
							if(!below) {
								// if nothing is below us, then we're inside if the other polygon is
								// inverted
								inside =
									ev.primary ? secondaryPolyInverted : primaryPolyInverted;
							}
							else { // otherwise, something is below us
								// so copy the below segment's other polygon's above
								if(ev.primary === below.primary)
									inside = below.seg.otherFill.above;
								else
									inside = below.seg.myFill.above;
							}
							ev.seg.otherFill = {
								above: inside,
								below: inside
							};
						}
					}

					// insert the status and remember it for later removal
					ev.other.status = surrounding.insert(List.node<Status>({ ev: ev }));
				}
				else {
					var st = ev.status;

					if(st === null) {
						throw new Error('PolyBool: Zero-length segment detected; your epsilon is ' +
							'probably too small or too large');
					}

					// removing the status will create two new adjacent edges, so we'll need to check
					// for those
					var i = status_list.getIndex(st);
					if(i > 0 && i < status_list.nodes.length - 1) {
						var before = status_list.nodes[i - 1], after = status_list.nodes[i + 1];
						checkIntersection(before.ev, after.ev);
					}

					// remove the status
					st.remove();

					// if we've reached this point, we've calculated everything there is to know, so
					// save the segment for reporting
					if(!ev.primary) {
						// make sure `seg.myFill` actually points to the primary polygon though
						var s = ev.seg.myFill;
						ev.seg.myFill = ev.seg.otherFill;
						ev.seg.otherFill = s;
					}
					segments.push(ev.seg);
				}

				// remove the event and continue
				event_list.getHead().remove();
			}

			return segments;
		}

		// return the appropriate API depending on what we're doing
		if(!selfIntersection) {
			// performing combination of polygons, so only deal with already-processed segments
			return {
				combine: function(segments1: Segment[], inverted1: boolean, segments2: Segment[], inverted2: boolean) {
					// segmentsX come from the self-intersection API, or this API
					// invertedX is whether we treat that list of segments as an inverted polygon or not
					// returns segments that can be used for further operations
					segments1.forEach(function(seg: Segment) {
						eventAddSegment(segmentCopy(seg.start, seg.end, seg), true);
					});
					segments2.forEach(function(seg: Segment) {
						eventAddSegment(segmentCopy(seg.start, seg.end, seg), false);
					});
					return calculate(inverted1, inverted2);
				}
			};
		}

		// otherwise, performing self-intersection, so deal with regions
		return {
			addRegion: function(region: Path) {
				// regions are a list of points:
				//  [ [0, 0], [100, 0], [50, 100] ]
				// you can add multiple regions before running calculate
				var pt1;
				var pt2 = region[region.length - 1];
				for(var i = 0; i < region.length; i++) {
					pt1 = pt2;
					pt2 = region[i];

					var forward = Epsilon.pointsCompare(pt1, pt2);
					if(forward === 0) // points are equal, so we have a zero-length segment
						continue; // just skip it

					eventAddSegment(
						segmentNew(
							forward < 0 ? pt1 : pt2,
							forward < 0 ? pt2 : pt1
						),
						true
					);
				}
			},
			calculate: function(inverted: boolean) {
				// is the polygon inverted?
				// returns segments
				return calculate(inverted, false);
			}
		};
	}

	namespace Epsilon {

		const eps = 0.0000000001;

		export function pointAboveOrOnLine(pt: Point, left: Point, right: Point): boolean {
			var Ax = left[0];
			var Ay = left[1];
			var Bx = right[0];
			var By = right[1];
			var Cx = pt[0];
			var Cy = pt[1];
			return (Bx - Ax) * (Cy - Ay) - (By - Ay) * (Cx - Ax) >= -eps;
		}

		export function pointBetween(p: Point, left: Point, right: Point) {
			// p must be collinear with left->right
			// returns false if p == left, p == right, or left == right
			var d_py_ly = p[1] - left[1];
			var d_rx_lx = right[0] - left[0];
			var d_px_lx = p[0] - left[0];
			var d_ry_ly = right[1] - left[1];

			var dot = d_px_lx * d_rx_lx + d_py_ly * d_ry_ly;
			// if `dot` is 0, then `p` == `left` or `left` == `right` (reject)
			// if `dot` is less than 0, then `p` is to the left of `left` (reject)
			if(dot < eps)
				return false;

			var sqlen = d_rx_lx * d_rx_lx + d_ry_ly * d_ry_ly;
			// if `dot` > `sqlen`, then `p` is to the right of `right` (reject)
			// therefore, if `dot - sqlen` is greater than 0, then `p` is to the right of `right` (reject)
			if(dot - sqlen > -eps)
				return false;

			return true;
		}

		export function pointsSameX(p1: Point, p2: Point) {
			return Math.abs(p1[0] - p2[0]) < eps;
		}

		export function pointsSameY(p1: Point, p2: Point) {
			return Math.abs(p1[1] - p2[1]) < eps;
		}

		export function pointsSame(p1: Point, p2: Point) {
			return pointsSameX(p1, p2) && pointsSameY(p1, p2);
		}

		export function pointsCompare(p1: Point, p2: Point): compare {
			// returns -1 if p1 is smaller, 1 if p2 is smaller, 0 if equal
			if(pointsSameX(p1, p2))
				return pointsSameY(p1, p2) ? 0 : (p1[1] < p2[1] ? -1 : 1);
			return p1[0] < p2[0] ? -1 : 1;
		}

		export function pointsCollinear(pt1: Point, pt2: Point, pt3: Point) {
			// does pt1->pt2->pt3 make a straight line?
			// essentially this is just checking to see if the slope(pt1->pt2) === slope(pt2->pt3)
			// if slopes are equal, then they must be collinear, because they share pt2
			var dx1 = pt1[0] - pt2[0];
			var dy1 = pt1[1] - pt2[1];
			var dx2 = pt2[0] - pt3[0];
			var dy2 = pt2[1] - pt3[1];
			return Math.abs(dx1 * dy2 - dx2 * dy1) < eps;
		}

		export function linesIntersect(a0: Point, a1: Point, b0: Point, b1: Point) {
			// returns false if the lines are coincident (e.g., parallel or on top of each other)
			//
			// returns an object if the lines intersect:
			//   {
			//     pt: [x, y],    where the intersection point is at
			//     alongA: where intersection point is along A,
			//     alongB: where intersection point is along B
			//   }
			//
			//  alongA and alongB will each be one of: -2, -1, 0, 1, 2
			//
			//  with the following meaning:
			//
			//    -2   intersection point is before segment's first point
			//    -1   intersection point is directly on segment's first point
			//     0   intersection point is between segment's first and second points (exclusive)
			//     1   intersection point is directly on segment's second point
			//     2   intersection point is after segment's second point
			var adx = a1[0] - a0[0];
			var ady = a1[1] - a0[1];
			var bdx = b1[0] - b0[0];
			var bdy = b1[1] - b0[1];

			var axb = adx * bdy - ady * bdx;
			if(Math.abs(axb) < eps)
				return false; // lines are coincident

			var dx = a0[0] - b0[0];
			var dy = a0[1] - b0[1];

			var A = (bdx * dy - bdy * dx) / axb;
			var B = (adx * dy - ady * dx) / axb;

			var ret = {
				alongA: 0,
				alongB: 0,
				pt: [
					a0[0] + A * adx,
					a0[1] + A * ady
				] as Point
			};

			// categorize where intersection point is along A and B

			if(A <= -eps)
				ret.alongA = -2;
			else if(A < eps)
				ret.alongA = -1;
			else if(A - 1 <= -eps)
				ret.alongA = 0;
			else if(A - 1 < eps)
				ret.alongA = 1;
			else
				ret.alongA = 2;

			if(B <= -eps)
				ret.alongB = -2;
			else if(B < eps)
				ret.alongB = -1;
			else if(B - 1 <= -eps)
				ret.alongB = 0;
			else if(B - 1 < eps)
				ret.alongB = 1;
			else
				ret.alongB = 2;

			return ret;
		}

		export function pointInsideRegion(pt: Point, region: Path) {
			var x = pt[0];
			var y = pt[1];
			var last_x = region[region.length - 1][0];
			var last_y = region[region.length - 1][1];
			var inside = false;
			for(var i = 0; i < region.length; i++) {
				var curr_x = region[i][0];
				var curr_y = region[i][1];

				// if y is between curr_y and last_y, and
				// x is to the right of the boundary created by the line
				if((curr_y - y > eps) != (last_y - y > eps) &&
					(last_x - curr_x) * (y - curr_y) / (last_y - curr_y) + curr_x - x > eps)
					inside = !inside

				last_x = curr_x;
				last_y = curr_y;
			}
			return inside;
		}
	}

	namespace SegmentSelector {
		function select(segments: Segment[], selection: number[]): Segment[] {
			var result: Segment[] = [];
			segments.forEach(function(seg) {
				var index =
					(seg.myFill.above ? 8 : 0) +
					(seg.myFill.below ? 4 : 0) +
					((seg.otherFill && seg.otherFill.above) ? 2 : 0) +
					((seg.otherFill && seg.otherFill.below) ? 1 : 0);
				if(selection[index] !== 0) {
					// copy the segment to the results, while also calculating the fill status
					result.push({
						start: seg.start,
						end: seg.end,
						myFill: {
							above: selection[index] === 1, // 1 if filled above
							below: selection[index] === 2  // 2 if filled below
						},
						otherFill: null
					});
				}
			});

			return result;
		}

		export function union(segments: Segment[]) { // primary | secondary
			// above1 below1 above2 below2    Keep?               Value
			//    0      0      0      0   =>   no                  0
			//    0      0      0      1   =>   yes filled below    2
			//    0      0      1      0   =>   yes filled above    1
			//    0      0      1      1   =>   no                  0
			//    0      1      0      0   =>   yes filled below    2
			//    0      1      0      1   =>   yes filled below    2
			//    0      1      1      0   =>   no                  0
			//    0      1      1      1   =>   no                  0
			//    1      0      0      0   =>   yes filled above    1
			//    1      0      0      1   =>   no                  0
			//    1      0      1      0   =>   yes filled above    1
			//    1      0      1      1   =>   no                  0
			//    1      1      0      0   =>   no                  0
			//    1      1      0      1   =>   no                  0
			//    1      1      1      0   =>   no                  0
			//    1      1      1      1   =>   no                  0
			return select(segments, [
				0, 2, 1, 0,
				2, 2, 0, 0,
				1, 0, 1, 0,
				0, 0, 0, 0
			]);
		}

		export function difference(segments: Segment[]) { // primary - secondary
			// above1 below1 above2 below2    Keep?               Value
			//    0      0      0      0   =>   no                  0
			//    0      0      0      1   =>   no                  0
			//    0      0      1      0   =>   no                  0
			//    0      0      1      1   =>   no                  0
			//    0      1      0      0   =>   yes filled below    2
			//    0      1      0      1   =>   no                  0
			//    0      1      1      0   =>   yes filled below    2
			//    0      1      1      1   =>   no                  0
			//    1      0      0      0   =>   yes filled above    1
			//    1      0      0      1   =>   yes filled above    1
			//    1      0      1      0   =>   no                  0
			//    1      0      1      1   =>   no                  0
			//    1      1      0      0   =>   no                  0
			//    1      1      0      1   =>   yes filled above    1
			//    1      1      1      0   =>   yes filled below    2
			//    1      1      1      1   =>   no                  0
			return select(segments, [
				0, 0, 0, 0,
				2, 0, 2, 0,
				1, 1, 0, 0,
				0, 1, 2, 0
			]);
		}

		export function xor(segments: Segment[]) { // primary ^ secondary
			// above1 below1 above2 below2    Keep?               Value
			//    0      0      0      0   =>   no                  0
			//    0      0      0      1   =>   yes filled below    2
			//    0      0      1      0   =>   yes filled above    1
			//    0      0      1      1   =>   no                  0
			//    0      1      0      0   =>   yes filled below    2
			//    0      1      0      1   =>   no                  0
			//    0      1      1      0   =>   no                  0
			//    0      1      1      1   =>   yes filled above    1
			//    1      0      0      0   =>   yes filled above    1
			//    1      0      0      1   =>   no                  0
			//    1      0      1      0   =>   no                  0
			//    1      0      1      1   =>   yes filled below    2
			//    1      1      0      0   =>   no                  0
			//    1      1      0      1   =>   yes filled above    1
			//    1      1      1      0   =>   yes filled below    2
			//    1      1      1      1   =>   no                  0
			return select(segments, [
				0, 2, 1, 0,
				2, 0, 0, 1,
				1, 0, 0, 2,
				0, 1, 2, 0
			]);
		}
	}

	interface Match {
		index: number;
		matches_head: boolean;
		matches_pt1: boolean;
	}

	function SegmentChainer(segments: Segment[]) {
		var chains: Path[] = [];
		var regions: Path[] = [];

		segments.forEach(function(seg) {
			var pt1 = seg.start;
			var pt2 = seg.end;
			if(Epsilon.pointsSame(pt1, pt2)) {
				console.warn('PolyBool: Warning: Zero-length segment detected; your epsilon is ' +
					'probably too small or too large');
				return;
			}

			// search for two chains that this segment matches
			var first_match: Match = {
				index: 0,
				matches_head: false,
				matches_pt1: false
			};
			var second_match: Match = {
				index: 0,
				matches_head: false,
				matches_pt1: false
			};
			var next_match = first_match;
			function setMatch(index: number, matches_head: boolean, matches_pt1: boolean) {
				// return true if we've matched twice
				next_match.index = index;
				next_match.matches_head = matches_head;
				next_match.matches_pt1 = matches_pt1;
				if(next_match === first_match) {
					next_match = second_match;
					return false;
				}
				next_match = null as any;
				return true; // we've matched twice, we're done here
			}
			for(var i = 0; i < chains.length; i++) {
				var chain = chains[i];
				var head = chain[0];
				var head2 = chain[1];
				var tail = chain[chain.length - 1];
				var tail2 = chain[chain.length - 2];
				if(Epsilon.pointsSame(head, pt1)) {
					if(setMatch(i, true, true))
						break;
				}
				else if(Epsilon.pointsSame(head, pt2)) {
					if(setMatch(i, true, false))
						break;
				}
				else if(Epsilon.pointsSame(tail, pt1)) {
					if(setMatch(i, false, true))
						break;
				}
				else if(Epsilon.pointsSame(tail, pt2)) {
					if(setMatch(i, false, false))
						break;
				}
			}

			if(next_match === first_match) {
				// we didn't match anything, so create a new chain
				chains.push([pt1, pt2]);
				return;
			}

			if(next_match === second_match) {
				// we matched a single chain

				// add the other point to the appropriate end, and check to see if we've closed the
				// chain into a loop

				var index = first_match.index;
				var pt = first_match.matches_pt1 ? pt2 : pt1; // if we matched pt1, then we add pt2, etc
				var addToHead = first_match.matches_head; // if we matched at head, then add to the head

				var chain = chains[index];
				var grow = addToHead ? chain[0] : chain[chain.length - 1];
				var grow2 = addToHead ? chain[1] : chain[chain.length - 2];
				var oppo = addToHead ? chain[chain.length - 1] : chain[0];
				var oppo2 = addToHead ? chain[chain.length - 2] : chain[1];

				if(Epsilon.pointsCollinear(grow2, grow, pt)) {
					// grow isn't needed because it's directly between grow2 and pt:
					// grow2 ---grow---> pt
					if(addToHead) {
						chain.shift();
					}
					else {
						chain.pop();
					}
					grow = grow2; // old grow is gone... new grow is what grow2 was
				}

				if(Epsilon.pointsSame(oppo, pt)) {
					// we're closing the loop, so remove chain from chains
					chains.splice(index, 1);

					if(Epsilon.pointsCollinear(oppo2, oppo, grow)) {
						// oppo isn't needed because it's directly between oppo2 and grow:
						// oppo2 ---oppo--->grow
						if(addToHead) {
							chain.pop();
						}
						else {
							chain.shift();
						}
					}

					// we have a closed chain!
					regions.push(chain);
					return;
				}

				// not closing a loop, so just add it to the appropriate side
				if(addToHead) {
					chain.unshift(pt);
				}
				else {
					chain.push(pt);
				}
				return;
			}

			// otherwise, we matched two chains, so we need to combine those chains together

			function reverseChain(index: number) {
				chains[index].reverse(); // gee, that's easy
			}

			function appendChain(index1: number, index2: number) {
				// index1 gets index2 appended to it, and index2 is removed
				var chain1 = chains[index1];
				var chain2 = chains[index2];
				var tail = chain1[chain1.length - 1];
				var tail2 = chain1[chain1.length - 2];
				var head = chain2[0];
				var head2 = chain2[1];

				if(Epsilon.pointsCollinear(tail2, tail, head)) {
					// tail isn't needed because it's directly between tail2 and head
					// tail2 ---tail---> head
					chain1.pop();
					tail = tail2; // old tail is gone... new tail is what tail2 was
				}

				if(Epsilon.pointsCollinear(tail, head, head2)) {
					// head isn't needed because it's directly between tail and head2
					// tail ---head---> head2
					chain2.shift();
				}

				chains[index1] = chain1.concat(chain2);
				chains.splice(index2, 1);
			}

			var F = first_match.index;
			var S = second_match.index;

			var reverseF = chains[F].length < chains[S].length; // reverse the shorter chain, if needed
			if(first_match.matches_head) {
				if(second_match.matches_head) {
					if(reverseF) {
						// <<<< F <<<< --- >>>> S >>>>
						reverseChain(F);
						// >>>> F >>>> --- >>>> S >>>>
						appendChain(F, S);
					}
					else {
						// <<<< F <<<< --- >>>> S >>>>
						reverseChain(S);
						// <<<< F <<<< --- <<<< S <<<<   logically same as:
						// >>>> S >>>> --- >>>> F >>>>
						appendChain(S, F);
					}
				}
				else {
					// <<<< F <<<< --- <<<< S <<<<   logically same as:
					// >>>> S >>>> --- >>>> F >>>>
					appendChain(S, F);
				}
			}
			else {
				if(second_match.matches_head) {
					// >>>> F >>>> --- >>>> S >>>>
					appendChain(F, S);
				}
				else {
					if(reverseF) {
						// >>>> F >>>> --- <<<< S <<<<
						reverseChain(F);
						// <<<< F <<<< --- <<<< S <<<<   logically same as:
						// >>>> S >>>> --- >>>> F >>>>
						appendChain(S, F);
					}
					else {
						// >>>> F >>>> --- <<<< S <<<<
						reverseChain(S);
						// >>>> F >>>> --- >>>> S >>>>
						appendChain(F, S);
					}
				}
			}
		});

		return regions;
	}

	namespace List {
		function bisect(compare: any) {
			return function right(a: any, x: any, lo?: number, hi?: number): number {
				if(!lo) lo = 0;
				if(!hi) hi = a.length;
				while(lo! < hi!) {
					var mid: number = lo! + hi! >>> 1;
					if(compare(a[mid], x) > 0) hi = mid;
					else lo = mid + 1;
				}
				return lo;
			};
		}

		export function create<T extends Node>() {
			var my = {
				nodes: [] as T[],
				exists: function(node: T) {
					return my.nodes.includes(node);
				},
				getIndex: function(node: T) {
					return my.nodes.indexOf(node);
				},
				isEmpty: function() {
					return my.nodes.length === 0;
				},
				getHead: function() {
					return my.nodes[0];
				},
				insertBefore: function(node: T, check: (v: T) => number) {
					my.findTransition(node, check).insert(node);
				},
				findTransition: function(node: T, check: (v: T) => number) {
					var i = bisect(function(a: T, b: T) { return check(b) - check(a); })(my.nodes, node);
					return {
						before: i === 0 ? null : my.nodes[i - 1],
						after: my.nodes[i] || null,
						insert: function(node: T) {
							my.nodes.splice(i, 0, node);
							node.remove = function() { my.nodes.splice(my.nodes.indexOf(node), 1); };
							return node;
						}
					};
				}
			};
			return my;
		};

		export function node<T extends Node>(data: T): T {
			return data;
		}
	}
}
