import { createTree } from "@utils/tree";
import { makeRng } from "@utils/fuzz";
import { getJSON } from "@utils/sample";
import { Migration } from "client/patches";
import { State } from "core/service/state";

export interface Edge {
	n1: number;
	n2: number;
	length: number;
}

export interface Flap {
	id: number;
	x: number;
	y: number;
	width: number;
	height: number;
}

/** A layout, given by the edges of the tree and the flaps. */
export interface Layout {
	edges: Edge[];
	flaps: Flap[];
}

/** A generated layout along with a description of where it comes from. */
export interface Sample {
	source: string;
	layout: Layout;
}

/**
 * Build the layout in the Core. Throws if it crashes, or if the layout itself
 * is inconsistent (which would be a bug of this tool).
 */
export function build(layout: Layout): void {
	assertConsistent(layout);
	// The NodeId type is not needed for constructing the tree here.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	createTree(layout.edges as any, layout.flaps as any);
}

/** The leaves of the tree (regarded as undirected) are exactly the flaps. */
function assertConsistent(layout: Layout): void {
	const degree = new Map<number, number>();
	for(const { n1, n2 } of layout.edges) {
		degree.set(n1, (degree.get(n1) ?? 0) + 1);
		degree.set(n2, (degree.get(n2) ?? 0) + 1);
	}
	const leaves = [...degree].filter(([, d]) => d == 1).map(([id]) => id);
	const flaps = new Set(layout.flaps.map(f => f.id));
	const mismatch = leaves.length != flaps.size ||
		leaves.some(id => !flaps.has(id));
	if(mismatch) {
		throw new Error(
			`Inconsistent layout: leaves ${leaves.join()} vs flaps ${[...flaps].join()}`
		);
	}
}

/**
 * Whether the current layout is worth checking, namely all junctions are
 * valid, and all stretches have patterns. Otherwise the contours are expected
 * to overlap, and the checks don't make sense.
 */
export function isCheckable(): boolean {
	for(const junction of State.$junctions.values()) {
		if(!junction.$valid) return false;
	}
	for(const stretch of State.$stretches.values()) {
		if(!stretch.$repo.$pattern) return false;
	}
	return true;
}

/** The parseTree() call reproducing the layout, ready to paste into a test. */
export function toParseTree(layout: Layout): string {
	const edges = layout.edges.map(e => `(${e.n1},${e.n2},${e.length})`);
	const flaps = layout.flaps.map(
		f => `(${f.id},${f.x},${f.y},${f.width},${f.height})`
	);
	return `parseTree(\n\t"${edges.join(",")}",\n\t"${flaps.join(",")}"\n);`;
}

type Rng = () => number;

/** The parameters of the random trees (see {@link randomTree}). */
const TREE = {
	/** The flaps are placed in a square of this size. */
	area: 100,
	/** The chance of a flap having width and height is one in this. */
	sizedChance: 3,
	maxSize: 3,
	minChildrenOfRoot: 2,
	extraChildrenOfRoot: 4,
	maxGrandchildren: 5,
	/** The chance of a flap being split further is one in this. */
	splitChance: 3,
	minSplit: 2,
	extraSplit: 2,
	minFlapLength: 2,
	extraFlapLength: 8,
	extraRiverLength: 4,
	extraLength: 6,
	extraSplitLength: 4,
};

function randomInt(rng: Rng, n: number): number {
	return Math.floor(rng() * n);
}

/**
 * A random tree with flaps spread far apart (so that it's surely valid).
 * The structure is shallow but includes rivers of various widths.
 */
function randomTree(rng: Rng): Layout {
	const r = (n: number): number => randomInt(rng, n);
	const edges: Edge[] = [];
	const flaps: Flap[] = [];
	let id = 1;
	const size = (): number =>
		r(TREE.sizedChance) == 0 ? r(TREE.maxSize) : 0;
	const addFlap = (f: number): void => {
		const [x, y] = [r(TREE.area), r(TREE.area)];
		flaps.push({ id: f, x, y, width: size(), height: size() });
	};
	const top = TREE.minChildrenOfRoot + r(TREE.extraChildrenOfRoot);
	for(let t = 0; t < top; t++) {
		const kids = r(TREE.maxGrandchildren);
		if(kids == 0) {
			const f = id++;
			const length = TREE.minFlapLength + r(TREE.extraFlapLength);
			edges.push({ n1: 0, n2: f, length });
			addFlap(f);
			continue;
		}
		const v = id++;
		edges.push({ n1: 0, n2: v, length: 1 + r(TREE.extraRiverLength) });
		for(let k = 0; k <= kids; k++) {
			const f = id++;
			edges.push({ n1: v, n2: f, length: 1 + r(TREE.extraLength) });
			if(r(TREE.splitChance) == 0) {
				const split = TREE.minSplit + r(TREE.extraSplit);
				for(let m = 0; m < split; m++) {
					const g = id++;
					const length = 1 + r(TREE.extraSplitLength);
					edges.push({ n1: f, n2: g, length });
					addFlap(g);
				}
			} else {
				addFlap(f);
			}
		}
	}
	return { edges, flaps };
}

const CENTER = 50;
const MAX_FAILS = 60;
const MAX_STEPS = 1500;
const SNAPSHOT_INTERVAL = 15;

/**
 * Generate compact layouts from random trees, by pushing a random flap towards
 * the center one unit at a time, as long as the layout stays valid. This
 * produces layouts with plenty of junctions and patterns, which are rare among
 * purely random layouts.
 *
 * Snapshots are yielded along the way: every few steps, and whenever there's
 * a node in raw mode (where most of the tricky cases are).
 */
export function* compactLayouts(seed: number): Generator<Sample> {
	const rng = makeRng(seed);
	const layout = randomTree(rng);
	const { flaps } = layout;
	let fails = 0, accepted = 0, steps = 0;
	while(fails < MAX_FAILS && steps++ < MAX_STEPS) {
		const flap = flaps[randomInt(rng, flaps.length)];
		const old = { x: flap.x, y: flap.y };
		if(rng() < 1 / 2) flap.x += Math.sign(CENTER - flap.x);
		else flap.y += Math.sign(CENTER - flap.y);
		if(flap.x == old.x && flap.y == old.y) {
			fails++;
			continue;
		}
		let valid = false;
		try {
			build(layout);
			valid = isValid();
		} catch {
			// Crashes are reported by the checks; here we just move on.
		}
		if(!valid) {
			flap.x = old.x;
			flap.y = old.y;
			fails++;
			continue;
		}
		fails = 0;
		accepted++;
		if(accepted % SNAPSHOT_INTERVAL == 0 || hasRawMode()) {
			yield {
				source: `compact seed ${seed} step ${steps}`,
				layout: cloneLayout(layout),
			};
		}
	}
}

const SAMPLES = [
	"v04.session.sample.json",
	"v08.riverRidge.sample.json",
];
const MAX_MOVES = 3;
const OFFSET_RANGE = 5;

/**
 * Load the layouts of the sample designs in `test/samples`. Note that the
 * edges are not necessarily directed from the root (any flap could become the
 * root after rebalancing), so they should be taken from the data, not the
 * built tree.
 */
export async function loadSamples(): Promise<Sample[]> {
	const jsons = await Promise.all(SAMPLES.map(file => getJSON(file)));
	return SAMPLES.map((file, i) => {
		const { tree, layout } = Migration.$process(jsons[i]).design;
		return {
			source: file,
			layout: cloneLayout({ edges: tree.edges, flaps: layout.flaps }),
		};
	});
}

/**
 * Perturb a sample design by moving a few flaps by small offsets. Only the
 * valid results are yielded.
 */
export function* perturbedLayouts(
	sample: Sample, seed: number, count: number
): Generator<Sample> {
	const rng = makeRng(seed);
	const r = (n: number): number => randomInt(rng, n);
	for(let i = 0; i < count; i++) {
		const layout = cloneLayout(sample.layout);
		const moves = 1 + r(MAX_MOVES);
		for(let k = 0; k < moves; k++) {
			const flap = layout.flaps[r(layout.flaps.length)];
			flap.x += r(OFFSET_RANGE) - Math.floor(OFFSET_RANGE / 2);
			flap.y += r(OFFSET_RANGE) - Math.floor(OFFSET_RANGE / 2);
		}
		try {
			build(layout);
			if(!isValid()) continue;
		} catch {
			continue;
		}
		yield { source: `${sample.source} seed ${seed} #${i}`, layout };
	}
}

function isValid(): boolean {
	for(const junction of State.$junctions.values()) {
		if(!junction.$valid) return false;
	}
	return true;
}

function hasRawMode(): boolean {
	return State.m.$tree.$nodes.some(
		n => n?.$graphics.$traceContours.some(t => t.$raw)
	);
}

export function cloneLayout(layout: Layout): Layout {
	return {
		edges: layout.edges.map(e => ({ ...e })),
		flaps: layout.flaps.map(f => ({ ...f })),
	};
}
