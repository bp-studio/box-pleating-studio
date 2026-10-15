import { describe, it, expect } from "@rstest/core";

import { Bridge } from "client/plugins/optimizer/bridge";
import { GridType } from "shared/json";
import optimizer from "lib/optimizer/debug/optimizer.js";

import type { OptimizerRequest } from "client/plugins/optimizer/types";

// Changes made to the C++ part will take effect after `make`

describe("Optimizer", () => {

	it("Solve SLSQP", async () => {
		const instance = await optimizer({
			print: () => undefined,
			checkInterrupt: () => false,
		});
		const bridge = new Bridge(instance);
		const result = await bridge.solve(simpleRequest);
		expect(result).to.deep.equal(simpleResult);
	});

	it("Solves problems with flap dimensions", async () => {
		const instance = await optimizer({
			print: () => undefined,
			checkInterrupt: () => false,
		});
		const bridge = new Bridge(instance);
		const result = await bridge.solve(dimensionRequest);
		expect(result).to.deep.equal({
			width: 66, height: 66,
			flaps: [
				{ id: 2, x: 39, y: 42 }, { id: 8, x: 47, y: 60 },
				{ id: 10, x: 61, y: 64 }, { id: 13, x: 64, y: 14 },
				{ id: 15, x: 66, y: 0 }, { id: 18, x: 34, y: 12 },
				{ id: 20, x: 26, y: 0 }, { id: 23, x: 13, y: 34 },
				{ id: 25, x: 0, y: 28 }, { id: 28, x: 14, y: 64 },
				{ id: 30, x: 0, y: 66 },
			],
		});
	});

	it("Generates random layouts", async () => {
		const instance = await optimizer({
			print: () => undefined,
			checkInterrupt: () => false,
		});
		const bridge = new Bridge(instance);
		const request = makeRequest({ command: "start", useBH: false, layout: "random", random: 5, problem: { type: "rect", flaps: [{ id: 10, width: 5, height: 2 }, { id: 8, width: 0, height: 6 }, { id: 2, width: 0, height: 0 }, { id: 30, width: 0, height: 0 }, { id: 28, width: 3, height: 0 }, { id: 15, width: 0, height: 0 }, { id: 13, width: 0, height: 4 }, { id: 20, width: 0, height: 0 }, { id: 18, width: 0, height: 0 }, { id: 25, width: 0, height: 0 }, { id: 23, width: 0, height: 0 }], hierarchies: [{ leaves: [0, 4, 22], distMap: [[0, 4, 69.01106755734327], [0, 22, 53.998387826512555], [4, 22, 51.603940012804706]], parents: [] }, { leaves: [1, 27, 12, 17, 25, 23], distMap: [[1, 27, 44.31352822539935], [12, 17, 41.19206971762632], [25, 23, 14], [25, 1, 46.56414235524315], [25, 27, 39.749385870156196], [23, 1, 42.56414235524315], [23, 27, 35.749385870156196], [25, 12, 43.89643957663932], [25, 17, 39.295630140987], [23, 12, 39.89643957663932], [23, 17, 35.295630140987], [1, 12, 56.46058193188247], [1, 17, 51.85977249623015], [27, 12, 49.64582544679551], [27, 17, 45.0450160111432]], parents: [{ id: 0, radius: 35.702757685525555, children: [1, 27] }, { id: 4, radius: 33.308309871817706, children: [12, 17] }, { id: 22, radius: 18.295630140987, children: [25, 23] }] }, { leaves: [7, 2, 30, 28, 15, 13, 20, 18, 25, 23], distMap: [[15, 13, 15.142670058480405], [30, 28, 14.877864968295356], [20, 18, 14], [7, 2, 25.97646861407305], [25, 23, 14], [15, 20, 38], [15, 18, 34], [13, 20, 35.142670058480405], [13, 18, 31.142670058480405], [30, 7, 41.97646861407305], [30, 2, 26], [28, 7, 38.8543335823684], [28, 2, 22.877864968295352], [25, 30, 38], [25, 28, 34.877864968295356], [25, 7, 45.97646861407305], [25, 2, 30], [23, 30, 34], [23, 28, 30.877864968295352], [23, 7, 41.97646861407305], [23, 2, 26], [25, 15, 42], [25, 13, 39.142670058480405], [25, 20, 38], [25, 18, 34], [23, 15, 38], [23, 13, 35.142670058480405], [23, 20, 34], [23, 18, 30], [30, 15, 46], [30, 13, 43.142670058480405], [30, 20, 42], [30, 18, 38], [28, 15, 42.877864968295356], [28, 13, 40.020535026775754], [28, 20, 38.877864968295356], [28, 18, 34.877864968295356], [7, 15, 53.97646861407305], [7, 13, 51.11913867255345], [7, 20, 49.97646861407305], [7, 18, 45.97646861407305], [2, 15, 38], [2, 13, 35.142670058480405], [2, 20, 34], [2, 18, 30]], parents: [{ id: 1, radius: 25.564142355243153, children: [7, 2] }, { id: 27, radius: 18.749385870156196, children: [30, 28] }, { id: 12, radius: 22.896439576639317, children: [15, 13] }, { id: 17, radius: 18.295630140987, children: [20, 18] }] }, { leaves: [10, 8, 2, 30, 28, 15, 13, 20, 18, 25, 23], distMap: [[10, 8, 17.78922614932899], [15, 13, 15.142670058480405], [30, 28, 14.877864968295356], [20, 18, 14], [25, 23, 14], [10, 2, 24.14854898724473], [8, 2, 19.64067716208426], [15, 20, 38], [15, 18, 34], [13, 20, 35.142670058480405], [13, 18, 31.142670058480405], [30, 10, 40.14854898724473], [30, 8, 35.64067716208426], [30, 2, 26], [28, 10, 37.02641395554008], [28, 8, 32.518542130379615], [28, 2, 22.877864968295352], [25, 30, 38], [25, 28, 34.877864968295356], [25, 10, 44.14854898724473], [25, 8, 39.64067716208426], [25, 2, 30], [23, 30, 34], [23, 28, 30.877864968295352], [23, 10, 40.14854898724473], [23, 8, 35.64067716208426], [23, 2, 26], [25, 15, 42], [25, 13, 39.142670058480405], [25, 20, 38], [25, 18, 34], [23, 15, 38], [23, 13, 35.142670058480405], [23, 20, 34], [23, 18, 30], [30, 15, 46], [30, 13, 43.142670058480405], [30, 20, 42], [30, 18, 38], [28, 15, 42.877864968295356], [28, 13, 40.020535026775754], [28, 20, 38.877864968295356], [28, 18, 34.877864968295356], [10, 15, 52.14854898724473], [10, 13, 49.29121904572513], [10, 20, 48.14854898724473], [10, 18, 44.14854898724473], [8, 15, 47.64067716208426], [8, 13, 44.783347220564664], [8, 20, 43.64067716208426], [8, 18, 39.64067716208426], [2, 15, 38], [2, 13, 35.142670058480405], [2, 20, 34], [2, 18, 30]], parents: [{ id: 7, radius: 20.97646861407305, children: [10, 8] }] }] }, vec: null });

		// This example triggers ROUNDOFF_LIMITED
		const result = await bridge.solve(request, 427089946);
		expect(result).to.deep.equal({
			width: 71,
			height: 71, flaps: [
				{ id: 10, x: 15, y: 0 }, { id: 8, x: 36, y: 8 },
				{ id: 2, x: 50, y: 27 }, { id: 30, x: 71, y: 0 },
				{ id: 28, x: 68, y: 14 }, { id: 15, x: 0, y: 52 },
				{ id: 13, x: 0, y: 67 }, { id: 20, x: 35, y: 71 },
				{ id: 18, x: 35, y: 57 }, { id: 25, x: 71, y: 57 },
				{ id: 23, x: 71, y: 71 },
			],
		});
	});

	it("Tidies layouts at least as well as known solutions", async () => {
		const logs: string[] = [];
		const instance = await optimizer({
			print: (s: string) => logs.push(s),
			checkInterrupt: () => false,
		});
		const bridge = new Bridge(instance);
		const result = await bridge.solve(tidyRequest, 1);
		expect(result.width).to.equal(20);

		// A known solution has 48 contour vertices and 32 uncovered junction
		// area. The tidying used to get stuck at (52, 53), as the proxy
		// optimum of the crucial neighborhood overshoots, and the improving
		// part of it was never tried (resolved by partial moves).
		const score = bestTidyScore(logs);
		expect(compareScore(score, [48, 32])).to.be.at.most(0);
	});

	// This is the template for examine issues. Uncomment to use it.

	// eslint-disable-next-line vitest/no-commented-out-tests
	// it("test", async () => {
	// 	const instance = await optimizer({ checkInterrupt: () => false });
	// 	const bridge = new Bridge(instance);
	// 	const request = makeRequest();
	// 	const result = await bridge.solve(request, 4108717089);
	// 	console.log(result);
	// });

});

function makeRequest(data: unknown): OptimizerRequest {
	return data as OptimizerRequest;
}

type Score = [vertices: number, area: number];

/** Lexicographic comparison of tidying scores; negative if `a` is better. */
function compareScore(a: Score, b: Score): number {
	return a[0] - b[0] || a[1] - b[1];
}

/**
 * The final score of the tidying stage, parsed from the logs.
 *
 * The tidying keeps the best of all the layouts it reaches, and the score of
 * each of them is logged at some point, so the final score is simply the best
 * among all the logged scores.
 */
function bestTidyScore(logs: string[]): Score {
	const pattern =
		/^Tidy: .*\(uncovered area (\d+), contour vertices (\d+)\)/;
	let best: Score | undefined;
	for(const line of logs) {
		const match = line.match(pattern);
		if(!match) continue;
		const score: Score = [Number(match[2]), Number(match[1])];
		if(!best || compareScore(score, best) < 0) best = score;
	}
	if(!best) throw new Error("No tidying score found in the logs.");
	return best;
}

/** [id, parent, distance to the root] */
type NodeData = [id: number, parent: number | null, dist: number];

/** [id, x, y, width, height], where the dimensions default to 0 */
type FlapData = [id: number, x: number, y: number, w?: number, h?: number];

/**
 * Create a view-mode {@link OptimizerRequest} on a rectangular sheet from a
 * rooted tree and the flaps on a sheet of the given size, with the
 * distances between the flaps derived from the tree.
 */
function createRequest(
	nodes: NodeData[], flaps: FlapData[], size: number
): OptimizerRequest {
	const parent = new Map(nodes.map(([id, p]) => [id, p]));
	const dist = new Map(nodes.map(([id, , d]) => [id, d]));
	const ancestors = (id: number | null): number[] =>
		id === null ? [] : [id, ...ancestors(parent.get(id)!)];
	const treeDist = (a: number, b: number): number => {
		const set = new Set(ancestors(a));
		const lca = ancestors(b).find(n => set.has(n))!;
		return dist.get(a)! + dist.get(b)! - 2 * dist.get(lca)!;
	};

	const leaves = flaps.map(([id]) => id);
	const distMap: [number, number, number][] = [];
	for(let i = 0; i < leaves.length; i++) {
		for(let j = i + 1; j < leaves.length; j++) {
			const [a, b] = [leaves[i], leaves[j]];
			distMap.push([a, b, treeDist(a, b)]);
		}
	}

	return makeRequest({
		command: "start",
		problem: {
			type: GridType.rectangular,
			flaps: flaps.map(([id, , , width = 0, height = 0]) =>
				({ id, width, height })),
			hierarchies: [{ leaves, distMap, parents: [] }],
			tree: nodes.map(([id, p, d]) => ({ id, parent: p, dist: d })),
		},
		layout: "view",
		useBH: false,
		random: 0,
		vec: flaps.map(([, x, y]) => ({ x: x / size, y: y / size })),
	});
}

const simpleRequest = createRequest(
	[[1, 5, 10], [2, 5, 6], [4, 5, 6], [5, null, 0]],
	[[1, 3, 3], [2, 4, 5], [4, 5, 4]],
	10
);

const dimensionRequest = createRequest(
	[
		[2, 32, 9], [8, 31, 17], [10, 31, 21], [13, 33, 25], [15, 33, 29],
		[18, 35, 21], [20, 35, 25], [23, 37, 17], [25, 37, 21], [28, 39, 13],
		[30, 39, 17], [31, 32, 12], [32, 38, 4], [33, 34, 20], [34, 36, 8],
		[35, 34, 16], [36, 38, 4], [37, 36, 12], [38, null, 0], [39, 38, 8],
	],
	[
		[2, 39, 42], [8, 47, 60, 0, 6], [10, 61, 64, 5, 2], [13, 64, 14, 0, 4],
		[15, 66, 0], [18, 34, 12], [20, 26, 0], [23, 13, 34], [25, 0, 28],
		[28, 14, 64, 3, 0], [30, 0, 66],
	],
	66
);

/**
 * A completely invalid layout, for which the tidying stage used to miss a
 * much neater solution. The tree is rooted at node 13, as the Core balances
 * the tree that way.
 */
const tidyRequest = createRequest(
	[
		[0, 13, 3], [1, 14, 3], [2, 7, 13], [3, 0, 10], [4, 0, 8],
		[5, 4, 10], [6, 4, 11], [7, 0, 11], [8, 7, 12], [9, 3, 11],
		[10, 0, 4], [11, 3, 11], [12, 3, 11], [13, null, 0], [14, 15, 2],
		[15, 13, 1], [16, 13, 1], [17, 15, 2], [18, 14, 3], [19, 0, 6],
		[20, 4, 9],
	],
	[
		[1, 12, 16], [2, 4, 3], [5, 2, 11], [6, 5, 14], [8, 6, 5],
		[9, 13, 5], [11, 13, 3], [12, 13, 7], [16, 12, 11], [17, 12, 13],
		[18, 12, 15], [19, 9, 8], [10, 5, 8], [20, 1, 12],
	],
	16
);

const simpleResult = {
	width: 15,
	height: 15,
	flaps: [
		{ id: 1, x: 0, y: 0 },
		{ id: 2, x: 6, y: 15 },
		{ id: 4, x: 15, y: 6 },
	],
};
