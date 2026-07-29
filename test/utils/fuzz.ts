import { DesignController } from "core/controller/designController";
import { TreeController } from "core/controller/treeController";
import { State } from "core/service/state";

import type { NodeId } from "shared/json/tree";

interface JFlapLike {
	id: NodeId;
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * A deterministic fuzzer for the Core tree/layout pipeline.
 *
 * It drives the same Client-facing controllers a real user would
 * ({@link DesignController.update} for dragging, {@link TreeController} for
 * structural edits), generating random-but-reproducible sessions of
 * operations. Every session is fully determined by its integer seed, so a
 * crashing session can be replayed from the seed alone, and the recorded
 * operation log can be delta-debugged into a minimal reproduction.
 *
 * This is how a rare rebalancing crash (a stale rough contour on the root,
 * originally seen in a build-1898 crash report) was found reproducible; the
 * fix and its guarding spec live in `roughContour.ts` and `tree.spec.ts`
 * ("Holds no rough contour on the root...").
 *
 * @example
 * // Hunt for a crashing operation sequence, then print a minimized repro.
 * function buildTree(): void {
 * 	parseTree("(0,1,1),(0,2,1),(2,3,1),(3,4,1)", "(1,0,8,0,0),(4,8,0,0,0)");
 * }
 * for(let seed = 1; seed <= 20000; seed++) {
 * 	const crash = runFuzzSession(seed, 500, buildTree);
 * 	if(crash) {
 * 		const min = minimizeOps(crash.ops, buildTree, crash.message);
 * 		console.log(`seed ${crash.seed}: ${crash.message}`);
 * 		console.log(min.map(o => `\t"${o}",`).join("\n"));
 * 		break;
 * 	}
 * }
 * // The printed op list can be pasted into a regression test and replayed
 * // via `replayOps(ops, buildTree)`.
 */

/** Positions a flap can be dragged to (corners, edges, interior). */
const SPOTS: ReadonlyArray<readonly [number, number]> = [
	[16, 16], [15, 15], [14, 14], [12, 12], [10, 10], [8, 8],
	[16, 0], [0, 16], [0, 0], [6, 10], [10, 6], [4, 4], [13, 3], [3, 13],
];

/** A deterministic PRNG (mulberry32). Same seed always yields the same stream. */
export function makeRng(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6D2B79F5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Ids of the current directed leaves (excluding the root). */
export function currentLeaves(): number[] {
	const out: number[] = [];
	for(const n of State.m.$tree.$nodes) if(n && n.$isLeaf && n.$parent) out.push(n.id);
	return out;
}

/** Ids of internal nodes with exactly one child (candidates for `join`). */
function joinableNodes(): number[] {
	const out: number[] = [];
	for(const n of State.m.$tree.$nodes) {
		if(n && n.$parent && !n.$isLeaf && n.$children.$size === 1) out.push(n.id);
	}
	return out;
}

function drag(id: number, x: number, y: number): void {
	DesignController.update({
		flaps: [{ id: id as NodeId, x, y, width: 0, height: 0 }],
		edges: [], stretches: [], dragging: true,
	});
}

/**
 * Deletes leaves, supplying flap prototypes for any parent that becomes a new
 * leaf, exactly as the Client does. This keeps the fuzzer within the
 * Core-trusts-Client contract (a new leaf always has an initialized AABB).
 */
function removeLeaves(ids: number[]): void {
	const alive = ids.filter(id => {
		const n = State.m.$tree.$nodes[id as NodeId];
		return n && n.$isLeaf && n.$parent;
	});
	if(!alive.length) return;
	const protos: JFlapLike[] = [];
	for(const id of alive) {
		const p = State.m.$tree.$nodes[id as NodeId]!.$parent!;
		if(p.$children.$size <= 1 && !alive.includes(p.id)) protos.push({ id: p.id, x: 8, y: 8, width: 0, height: 0 });
	}
	TreeController.removeLeaf(alive as NodeId[], protos);
}

function addLeaf(nid: number, at: number, x: number, y: number): void {
	TreeController.addLeaf(nid as NodeId, at as NodeId, 1, { id: nid as NodeId, x, y, width: 0, height: 0 });
}

function tryJoin(id: number): void {
	try { TreeController.join(id as NodeId); } catch { /* skip invalid join */ }
}

/** Picks 1-3 distinct leaves to delete in one batch. */
function pickLeavesToRemove(leaves: number[], rng: () => number, pick: <T>(a: T[]) => T): number[] {
	const k = 1 + Math.floor(rng() * Math.min(3, leaves.length - 4));
	const ids: number[] = [];
	for(let j = 0; j < k; j++) {
		const id = pick(leaves.filter(f => !ids.includes(f)));
		if(id === undefined) break;
		ids.push(id);
	}
	return ids;
}

/** The result of a fuzz session that ended in a crash. */
export interface FuzzCrash {
	readonly seed: number;
	readonly message: string;
	/** Human-readable operation log, replayable via {@link execOp}. */
	readonly ops: string[];
	readonly stack: string;
}

/**
 * Runs one random session of up to {@link steps} operations against the tree
 * built by {@link build}. Returns crash info if it threw, or `null` otherwise.
 *
 * The operations mirror a real tree-mode editing session: mostly dragging,
 * with leaf additions/deletions and occasional structural `join`s. The exact
 * distribution matches what reproduced the build-1898 crash.
 */
export function runFuzzSession(seed: number, steps: number, build: () => void): FuzzCrash | null {
	build();
	const rng = makeRng(seed);
	const ops: string[] = [];
	const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
	const spot = (): [number, number] => pick(SPOTS as Array<[number, number]>);
	let nextId = 100;
	try {
		for(let step = 0; step < steps; step++) {
			const leaves = currentLeaves();
			if(leaves.length === 0) break;
			const r = rng();
			if(r < 0.5) {
				const id = pick(leaves);
				const [x, y] = spot();
				ops.push(`drag ${id}->(${x},${y})`);
				drag(id, x, y);
			} else if(r < 0.7 && leaves.length > 4) {
				const ids = pickLeavesToRemove(leaves, rng, pick);
				ops.push(`removeLeaf [${ids}]`);
				removeLeaves(ids);
			} else if(r < 0.92) {
				const at = pick(leaves);
				const [x, y] = spot();
				nextId++;
				ops.push(`addLeaf ${nextId}@${at}->(${x},${y})`);
				addLeaf(nextId, at, x, y);
			} else {
				const inner = joinableNodes();
				if(!inner.length) continue;
				const id = pick(inner);
				ops.push(`join ${id}`);
				tryJoin(id);
			}
		}
	} catch(e) {
		return {
			seed, message: (e as Error).message, ops,
			stack: (e as Error).stack?.split("\n").slice(0, 12).join("\n") ?? "",
		};
	}
	return null;
}

/**
 * Replays a single operation produced by {@link runFuzzSession}. Operations
 * referencing a node that no longer exists are silently skipped (they were
 * no-ops in the original run too), which lets a recorded op list survive
 * delta-debugging.
 */
export function execOp(op: string): void {
	let m: RegExpMatchArray | null;
	if((m = op.match(/^drag (\d+)->\((-?\d+),(-?\d+)\)$/))) {
		const id = Number(m[1]);
		if(State.m.$tree.$nodes[id as NodeId]) drag(id, Number(m[2]), Number(m[3]));
	} else if((m = op.match(/^removeLeaf \[([\d,]*)\]$/))) {
		if(m[1]) removeLeaves(m[1].split(",").map(Number));
	} else if((m = op.match(/^addLeaf (\d+)@(\d+)->\((-?\d+),(-?\d+)\)$/))) {
		const nid = Number(m[1]), at = Number(m[2]);
		if(State.m.$tree.$nodes[at as NodeId] && !State.m.$tree.$nodes[nid as NodeId]) {
			addLeaf(nid, at, Number(m[3]), Number(m[4]));
		}
	} else if((m = op.match(/^join (\d+)$/))) {
		const id = Number(m[1]);
		const n = State.m.$tree.$nodes[id as NodeId];
		if(n && n.$parent && !n.$isLeaf && n.$children.$size === 1) TreeController.join(id as NodeId);
	}
}

/** Replays a full op list against the tree built by {@link build}. */
export function replayOps(ops: readonly string[], build: () => void): void {
	build();
	for(const op of ops) execOp(op);
}

/**
 * Delta-debugs a crashing op list into a smaller one that still reproduces the
 * same crash (matched by {@link messageIncludes}). Greedy single-op removal
 * followed by contiguous-chunk removal.
 */
export function minimizeOps(ops: string[], build: () => void, messageIncludes: string): string[] {
	const stillCrashes = (candidate: string[]): boolean => {
		build();
		try {
			for(const op of candidate) execOp(op);
		} catch(e) {
			return (e as Error).message.includes(messageIncludes);
		}
		return false;
	};

	let current = ops.slice();
	let changed = true;
	while(changed) {
		changed = false;
		for(let i = current.length - 1; i >= 0; i--) {
			const removeOne = current.slice(0, i).concat(current.slice(i + 1));
			if(stillCrashes(removeOne)) {
				current = removeOne;
				changed = true;
			}
		}
	}
	for(let size = Math.min(16, current.length); size >= 1; size = Math.floor(size / 2)) {
		let i = 0;
		while(i + size <= current.length) {
			const removeChunk = current.slice(0, i).concat(current.slice(i + size));
			if(stillCrashes(removeChunk)) current = removeChunk;
			else i++;
		}
	}
	return current;
}
