import { createTree } from "./tree";
import { currentLeaves, execOp, makeRng, minimizeOpsBy } from "./fuzz";
import { DesignController } from "core/controller/designController";
import { State, fullReset } from "core/service/state";
import { SlashDirection } from "shared/types/direction";
import { getDist } from "core/design/context/treeUtils";
import { serialize, sortBySerialization, sortLines } from "./serialize";

import type { JDesign, JEdge, JFlap, NodeId } from "shared/json";

/**
 * From-scratch consistency checking for the Core.
 *
 * The incremental updating of the Core is correct if and only if, after any
 * sequence of operations, the resulting state is the same as the one obtained
 * by computing the final design from scratch. Here "from scratch" means saving
 * the current design (tree, flaps and the chosen stretch patterns) and loading
 * it again, so that the legitimately history-dependent choices (the root of the
 * tree and the patterns) are carried over as they would be in a real file.
 *
 * The compared state is the full set of graphics the Core holds (see
 * {@link graphicsSnapshot}), not the {@link UpdateModel} deltas.
 *
 * @example
 * // Hunt for an inconsistency, checking after every op, then print a
 * // minimized repro (replayable via `checkConsistency`).
 * for(let seed = 1; seed <= 1000; seed++) {
 * 	const failure = runConsistencySession(seed, 100, 1);
 * 	if(failure) {
 * 		const ops = minimizeConsistency(failure);
 * 		console.log(`seed ${seed}: ${failure.diff}`);
 * 		console.log(ops.map(o => `\t"${o}",`).join("\n"));
 * 		break;
 * 	}
 * }
 */

/** A session whose final state differs from the from-scratch state. */
export interface ConsistencyFailure {
	readonly seed: number;
	readonly ops: string[];
	/** The first differing graphics tag and the two versions of it. */
	readonly diff: string;
}

interface Rect {
	id: number;
	x: number;
	y: number;
	width: number;
	height: number;
}

type Rng = () => number;

/**
 * Whether the flaps (given by their rectangles and their distance on the tree)
 * do not form an invalid junction, that is, either they do not overlap at all,
 * or they form a valid junction (see {@link createJunction}).
 */
function compatible(a: Rect, b: Rect, d: number): boolean {
	const gx = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width));
	const gy = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height));
	if(gx >= d || gy >= d) return true;
	return gx > 0 && gy > 0 && gx * gx + gy * gy >= d * d;
}

/**
 * Finds a position for the flap. Most of the time the flap is put diagonally
 * next to another flap at about their tree distance, which is how valid
 * junctions (and hence stretches) are formed in real designs. Positions forming
 * invalid junctions are rejected if possible.
 */
function findSpot(
	rng: Rng, rect: Rect, others: readonly Rect[],
	dist: (a: number, b: number) => number
): [number, number] {
	const int = (n: number): number => Math.floor(rng() * n);
	for(let tries = 0; tries < 30; tries++) {
		let x = int(25), y = int(25);
		if(others.length && rng() < 0.8) {
			const o = others[int(others.length)];
			const d = dist(rect.id, o.id);
			const gx = 1 + int(Math.max(d - 1, 1));
			const gy = Math.ceil(Math.sqrt(Math.max(d * d - gx * gx, 1)));
			x = rng() < 0.5 ? o.x + o.width + gx : o.x - gx - rect.width;
			y = rng() < 0.5 ? o.y + o.height + gy : o.y - gy - rect.height;
		}
		const candidate = { ...rect, x, y };
		if(others.every(o => compatible(candidate, o, dist(rect.id, o.id)))) {
			return [x, y];
		}
	}
	return [int(25), int(25)];
}

/**
 * Builds a random tree with flaps from the seed. Nodes are attached to random
 * earlier nodes, so the shape varies from paths to stars.
 */
export function buildRandomDesign(seed: number): () => void {
	return () => {
		const rng = makeRng(seed ^ 0x5EED);
		const int = (n: number): number => Math.floor(rng() * n);
		const count = 6 + int(9);
		const edges: JEdge[] = [];
		const adjacency: [number, number][][] = [[]];
		for(let i = 1; i < count; i++) {
			const at = int(i), length = 1 + int(3);
			edges.push({ n1: at as NodeId, n2: i as NodeId, length });
			adjacency[i] = [[at, length]];
			adjacency[at].push([i, length]);
		}
		const distances = adjacency.map((_, i) => distancesFrom(adjacency, i));
		const flaps: JFlap[] = [];
		for(let i = 0; i < count; i++) {
			if(adjacency[i].length != 1) continue;
			const rect = { id: i, x: 0, y: 0, width: int(3), height: int(3) };
			const dist = (a: number, b: number): number => distances[a][b];
			[rect.x, rect.y] = findSpot(rng, rect, flaps, dist);
			flaps.push(rect as JFlap);
		}
		createTree(edges, flaps);
	};
}

function distancesFrom(
	adjacency: [number, number][][], from: number
): number[] {
	const result: number[] = [];
	result[from] = 0;
	const stack = [from];
	while(stack.length) {
		const n = stack.pop()!;
		for(const [m, length] of adjacency[n]) {
			if(result[m] !== undefined) continue;
			result[m] = result[n] + length;
			stack.push(m);
		}
	}
	return result;
}

function leafRects(): Rect[] {
	return currentLeaves().map(id => {
		const node = State.m.$tree.$nodes[id as NodeId]!;
		const [top, right, bottom, left] = node.$AABB.$toValues();
		const [x, y] = [left, bottom];
		return { id, x, y, width: right - left, height: top - bottom };
	});
}

function treeDist(a: number, b: number): number {
	const nodes = State.m.$tree.$nodes;
	return getDist(nodes[a as NodeId]!, nodes[b as NodeId]!);
}

/** Generates the next random op for the current state, or `null` to skip. */
function randomOp(rng: Rng, newId: () => number): string | null {
	const int = (n: number): number => Math.floor(rng() * n);
	const pick = <T>(arr: readonly T[]): T => arr[int(arr.length)];
	const rects = leafRects();
	const others = (id: number): Rect[] => rects.filter(r => r.id !== id);
	const r = rng();
	if(r < 0.35) {
		const rect = pick(rects);
		let x = rect.x + int(5) - 2, y = rect.y + int(5) - 2;
		if(rng() < 0.75) {
			[x, y] = findSpot(rng, rect, others(rect.id), treeDist);
		}
		return `drag ${rect.id}->(${x},${y})`;
	} else if(r < 0.45) {
		const rect = { ...pick(rects), width: int(3), height: int(3) };
		const [x, y] = findSpot(rng, rect, others(rect.id), treeDist);
		return `flap ${rect.id}->(${x},${y},${rect.width},${rect.height})`;
	} else if(r < 0.55) {
		return "dragEnd";
	} else if(r < 0.67) {
		const nodes = State.m.$tree.$nodes.filter(n => n && n.$parent);
		return `length ${pick(nodes)!.id}=${1 + int(4)}`;
	} else if(r < 0.79) {
		if(rects.length <= 4) return null;
		return `removeLeaf [${pick(rects).id}]`;
	} else if(r < 0.94) {
		if(rects.length >= 14) return null;
		const nodes = State.m.$tree.$nodes.filter(n => n);
		const at = pick(nodes)!.id, id = newId();
		const rect = { id, x: 0, y: 0, width: 0, height: 0 };
		const dist = (_: number, b: number): number => treeDist(at, b) + 1;
		const candidates = rects.filter(o => o.id !== at);
		const [x, y] = findSpot(rng, rect, candidates, dist);
		return `addLeaf ${id}@${at}->(${x},${y})`;
	} else {
		const inner = State.m.$tree.$nodes.filter(n =>
			n && n.$parent && !n.$isLeaf && n.$children.$size === 1
		);
		if(!inner.length) return null;
		return `join ${pick(inner)!.id}`;
	}
}

/**
 * Generates and executes a random session of operations, always ending with a
 * `dragEnd` as the Client would. Returns the executed op list.
 *
 * Like the Client, a `dragEnd` is always sent before any other kind of ops if
 * the session is dragging, as the stretches cached during dragging are not
 * meant to survive the changes of the tree.
 */
function runSession(rng: Rng, steps: number): string[] {
	const ops: string[] = [];
	let nextId = 100;
	let dragging = false;
	const exec = (op: string): void => {
		ops.push(op);
		execOp(op);
	};
	const newId = (): number => ++nextId;
	for(let step = 0; step < steps; step++) {
		const op = randomOp(rng, newId);
		if(!op) continue;
		const isDrag = op.startsWith("drag ") || op.startsWith("flap ");
		if(dragging && !isDrag && op !== "dragEnd") exec("dragEnd");
		dragging = isDrag;
		exec(op);
	}
	exec("dragEnd");
	return ops;
}

/** Saves the current design as the Client would. */
function saveDesign(): JDesign {
	const tree = State.m.$tree;
	const flaps: JFlap[] = [];
	for(const node of tree.$nodes) {
		if(!node || !node.$isLeaf) continue;
		const [top, right, bottom, left] = node.$AABB.$toValues();
		flaps.push({
			id: node.id, x: left, y: bottom,
			width: right - left, height: top - bottom,
		});
	}
	return {
		tree: { edges: tree.toJSON().edges },
		layout: {
			flaps,
			stretches: [...State.$stretches.values()].map(s => s.toJSON()),
		},
	} as unknown as JDesign;
}

/** Reloads the given design from scratch. */
function loadDesign(design: JDesign): void {
	fullReset();
	DesignController.init(structuredClone(design));
}

type Snapshot = Record<string, string>;

/**
 * The full graphics held by the Core, keyed by the same tags used in
 * {@link UpdateModel.graphics}, each serialized canonically (independent of
 * the ordering of contours and ridges).
 */
export function graphicsSnapshot(): Snapshot {
	const result: Snapshot = {};
	for(const node of State.m.$tree.$nodes) {
		if(!node || !node.$parent) continue;
		const g = node.$graphics;
		result[node.$tag] = serialize({
			contours: sortBySerialization(g.$contours),
			ridges: sortLines(g.$ridges),
		});
	}
	for(const stretch of State.$stretches.values()) {
		const repo = stretch.$repo;
		if(!repo.$pattern) continue;
		const forward = repo.$direction == SlashDirection.FW;
		for(const [i, device] of repo.$pattern.$devices.entries()) {
			result["s" + stretch.$id + "." + i] = serialize({
				contours: sortBySerialization(device.$contour),
				ridges: sortLines(device.$drawRidges),
				axisParallel: sortLines(device.$axisParallels),
				location: device.$location,
				range: device.$getDraggingRange(),
				forward,
			});
		}
	}
	const invalid: string[] = [];
	for(const j of State.$junctions.values()) {
		if(!j.$valid) invalid.push(j.$a.id + "," + j.$b.id);
	}
	result.invalidJunctions = serialize(invalid.sort());
	return result;
}

/** Returns a description of the differences, or `null` if equal. */
function compareSnapshots(a: Snapshot, b: Snapshot): string | null {
	const tags = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
	const diffs = tags
		.filter(tag => a[tag] !== b[tag])
		.map(tag => `${tag}\n  incremental:  ${a[tag]}\n  from scratch: ${b[tag]}`);
	return diffs.length ? diffs.join("\n") : null;
}

/**
 * Executes the ops on the design built by {@link build}, and compares the
 * result with the from-scratch result.
 */
export function checkConsistency(
	build: () => void, ops: readonly string[]
): string | null {
	build();
	for(const op of ops) execOp(op);
	return compareWithScratch();
}

function compareWithScratch(): string | null {
	const incremental = graphicsSnapshot();
	saveAndLoad();
	return compareSnapshots(incremental, graphicsSnapshot());
}

/** Replaces the current state with the from-scratch one. */
export function saveAndLoad(): void {
	loadDesign(saveDesign());
}

/**
 * Runs one random session and checks its state after every {@link interval}
 * ops (and at the end), by replaying the prefixes. Checking only the final
 * state is not enough, as an inconsistency could be masked by later ops.
 */
export function runConsistencySession(
	seed: number, steps: number, interval: number = steps
): ConsistencyFailure | null {
	const build = buildRandomDesign(seed);
	build();
	const ops = runSession(makeRng(seed), steps);
	for(let n = interval; ; n += interval) {
		const prefix = ops.slice(0, n);
		const diff = checkConsistency(build, prefix);
		if(diff) return { seed, ops: prefix, diff };
		if(n >= ops.length) return null;
	}
}

/** Delta-debugs a failing session into a minimal op list. */
export function minimizeConsistency(failure: ConsistencyFailure): string[] {
	const build = buildRandomDesign(failure.seed);
	return minimizeOpsBy(failure.ops, ops => {
		try {
			return checkConsistency(build, ops) !== null;
		} catch {
			return false;
		}
	});
}
