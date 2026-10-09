import { QV } from "../quadrant";
import { CornerType } from "shared/json";
import { convertIndex } from "shared/utils/pattern";
import { Direction, makeQuadrantCode, opposite } from "shared/types/direction";
import { debugAssert } from "core/utils/debug";
import { Overlap } from "core/math/sweepLine/clip/overlap";

import type { JJunction, JOverlap, NodeId } from "shared/json";
import type { QuadrantCode } from "shared/types/direction";
import type { Device } from "../device";
import type { PositioningContext } from "./positioningContext";
import type { JointCorner } from "../../generators/searchUtils/relay";

//=================================================================
/**
 * {@link jointPositioner} is for several {@link JJunction}s sharing the same
 * quadrant of a flap (a joint), possibly with two joints connected by a bridge.
 *
 * The {@link Device} containing the joint corner (the kept overlaps, possibly
 * joined) is pushed towards the joint, and the other {@link Device}s (relayed
 * onto it, directly or not) are pushed outwards as far as possible. A device
 * relayed at both ends (the bridge) is placed in the middle of its range.
 */
//=================================================================
export function jointPositioner(context: PositioningContext): boolean {
	const joints = getJointCodes(context.$junctions);
	// Note that in relayed joins, the joint corner of one of the overlaps is
	// internal, and that of the other is coincide.
	const getRootCorners = (device: Device): JointCorner[] =>
		([Direction.UR, Direction.LL] as const).filter(s =>
			device.$partition.$overlaps.some(o => {
				const c = context.$junctions[o.parent].c[s];
				return o.c[s].type == CornerType.flap &&
					joints.has(makeQuadrantCode(c.e as NodeId, c.q!));
			})
		);

	const relays: Relay[] = [];
	for(const device of context.$devices) {
		const corners = getRootCorners(device);
		// Kept at both joints; not supported for the moment.
		if(corners.length > 1) return false;
		if(corners.length == 1) {
			pushTowardsJoint(context, device, corners[0]);
			continue;
		}
		// This check is needed for some invalid layouts in earlier versions,
		// but so far no such layouts have been found under the current
		// searching.
		/* istanbul ignore next: foolproof */
		if(!checkDeltaRay(context, device)) return false;
		const relay = measure(context, device);
		if(!relay) return false;
		relays.push(relay);
	}
	pushOutwards(relays);
	return true;
}

/**
 * Whether any two of the positioned {@link Device}s overlap. This can only be
 * checked after the {@link Device}s are initialized (see {@link Pattern}).
 *
 * The slack of a relay only avoids the {@link Device} it is relayed onto (see
 * PositioningContext._setupSlackForOverlap). In nested relays, the middle one
 * sits in the concave corner of two others, and it could still overlap the one
 * it is not relayed onto, even after being pushed outwards as far as possible.
 */
export function hasOverlappingDevices(devices: readonly Device[]): boolean {
	const contours = devices.map(d => d.$contour.map(c => c.outer));
	return contours.some((paths1, i) =>
		contours.slice(i + 1).some(paths2 =>
			paths1.some(p1 => paths2.some(p2 => Overlap.$test(p1, p2)))
		)
	);
}

function pushTowardsJoint(
	context: PositioningContext, device: Device, s: JointCorner
): void {
	if(s == Direction.UR) return;
	const j = context.$getJunctions(device)[0];
	const gadget = device.$gadgets[0];
	device.$offset =
		j.sx - context.$getSpan(gadget, Direction.UR) - gadget.widthSpan.value;
}

/** A relayed {@link Device}, see {@link measure}. */
interface Relay {
	readonly device: Device;

	/** The {@link Device} it is relayed onto. */
	readonly target: Device;

	readonly q: JointCorner;

	/** The room of each gadget to move outwards from the target. */
	readonly rooms: readonly number[];

	/** The room of the device (the smallest room of its gadgets). */
	room: number;

	readonly targetSlack: number;

	/** The minimal slack between the device and the target. */
	readonly slack: number;

	/** Whether the device is also relayed at the other end. */
	readonly bridge: boolean;
}

/**
 * Measure the room for a relayed {@link Device} to move outwards from its
 * target, and check if there's enough room for the slack of the relay.
 */
function measure(context: PositioningContext, device: Device): Relay | null {
	const { overlap, q } = getConnection(device);
	const corner = overlap.c[q];
	const index = convertIndex(corner.e);
	debugAssert(
		() => context.$overlaps[index].c[corner.q!].type == CornerType.socket,
		"Relay without socket"
	);
	const targetGadget = context.$gadgets[index];
	const targetSlack = targetGadget.$slack.value[corner.q!];
	const target =
		context.$devices.find(d => d.$gadgets.includes(targetGadget))!;

	// In relayed joins, the device has more than one gadget, and all of them
	// must fit their own junctions, so the smallest room applies. The gadgets
	// relayed at the other end as well (the bridges) must also leave room for
	// the gadgets there, including the slack in between.
	const junctions = context.$getJunctions(device);
	const rooms = device.$gadgets.map((gadget, i) =>
		junctions[i].sx - context.$getSpan(gadget, q) -
		context.$getSpan(gadget, opposite(q) as JointCorner, true) -
		gadget.widthSpan.value
	);
	const room = Math.min(...rooms);

	const gadget = device.$gadgets[0];
	const slack = Math.floor(gadget.$slack.value[q]);
	if(room + targetSlack < slack) return null;
	const bridge = overlap.c[opposite(q)].type == CornerType.internal;
	return { device, target, q, rooms, room, targetSlack, slack, bridge };
}

/**
 * Push the relayed {@link Device}s outwards as far as possible.
 *
 * The rooms are measured with the whole chain of relays at the innermost
 * positions. As a target moves outwards, so does its corner where the others
 * are relayed onto, which takes up their rooms. So in nested relays, the ones
 * at the ends of the chains are pushed first, and each target can move
 * outwards only as far as the ones relayed onto it can.
 */
function pushOutwards(relays: Relay[]): void {
	const getParent = (relay: Relay): Relay | undefined =>
		relays.find(r => r.device == relay.target);
	const depth = (relay: Relay): number => {
		const parent = getParent(relay);
		return parent ? depth(parent) + 1 : 0;
	};
	const sorted = relays.concat().sort((a, b) => depth(b) - depth(a));
	for(const relay of sorted) {
		const parent = getParent(relay);
		if(parent) parent.room = Math.min(parent.room, relay.room);
	}

	for(const relay of relays) {
		const { device, q, rooms, room, targetSlack } = relay;
		if(q == Direction.UR) {
			// The displacement reference is the target, so the movement of the
			// target is excluded.
			const parentRoom = getParent(relay)?.room ?? 0;
			const outer = room - parentRoom + targetSlack;
			device.$offset = relay.bridge ?
				Math.floor((relay.slack + outer) / 2) : outer;
		} else {
			// Otherwise the displacement reference is the flap corner of the
			// first gadget, so the device is at the outer end of the first
			// gadget, and we need to move it back for the others.
			device.$offset = rooms[0] - room;
		}
	}
}

/**
 * If the target of the relay is a single {@link Gadget}, and the delta ray is
 * still closer than the target after the pushing, then it won't work. This
 * check is needed in some invalid layouts.
 */
function checkDeltaRay(context: PositioningContext, device: Device): boolean {
	const { overlap, q } = getConnection(device);
	const index = convertIndex(overlap.c[q].e);
	const target = context.$gadgets[index];
	const device2 = context.$devices.find(d => d.$gadgets.includes(target))!;
	if(device2.$gadgets.length > 1) return true;

	const j1 = context.$junctions[context.$overlaps[index].parent];
	const j2 = context.$junctions[overlap.parent];
	const deltaPt = context.$getRelativeDelta(j1, j2, target);
	return !target.$intersects(deltaPt, QV[q]);
}

/** The internal corner of a relayed {@link Device}. */
function getConnection(
	device: Device
): { overlap: JOverlap, q: JointCorner } {
	const overlap = device.$partition.$overlaps[0];
	const q = overlap.c[0].type == CornerType.internal ?
		Direction.UR : Direction.LL;
	return { overlap, q };
}

/** The quadrants shared by more than one {@link JJunction} (the joints). */
function getJointCodes(junctions: readonly JJunction[]): Set<QuadrantCode> {
	const counts = new Map<QuadrantCode, number>();
	for(const j of junctions) {
		for(const c of [j.c[0], j.c[2]]) {
			const code = makeQuadrantCode(c.e as NodeId, c.q!);
			counts.set(code, (counts.get(code) ?? 0) + 1);
		}
	}
	return new Set([...counts].filter(([, n]) => n > 1).map(([code]) => code));
}
