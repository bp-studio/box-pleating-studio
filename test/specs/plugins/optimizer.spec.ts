import { expect } from "chai";

import { Bridge } from "client/plugins/optimizer/bridge";
import { GridType } from "shared/json";
import optimizer from "lib/optimizer/debug/optimizer.js";

import type { OptimizerRequest } from "client/plugins/optimizer/types";

// Changes made to the C++ part will take effect after `make`

describe("Optimizer", function() {

	it("Solve SLSQP", async function() {
		const instance = await optimizer({
			print: () => undefined,
			checkInterrupt: () => false,
		});
		const bridge = new Bridge(instance);
		const result = await bridge.solve(simpleRequest);
		expect(result).to.deep.equal(simpleResult);
	});

	it("Runs in async mode", async function() {
		const instance = await optimizer({
			print: () => undefined,
			checkInterruptAsync: () => Promise.resolve(false),
		});
		const bridge = new Bridge(instance, true);
		const result = await bridge.solve(simpleRequest);
		expect(result).to.deep.equal(simpleResult);
	});

	it("Solves problems with flap dimensions", async function() {
		const instance = await optimizer({
			print: () => undefined,
			checkInterrupt: () => false,
		});
		const bridge = new Bridge(instance);
		const request = makeRequest({ command: "start", useBH: false, layout: "view", random: 0, problem: { type: "rect", flaps: [{ id: 2, width: 0, height: 0 }, { id: 8, width: 0, height: 6 }, { id: 10, width: 5, height: 2 }, { id: 13, width: 0, height: 4 }, { id: 15, width: 0, height: 0 }, { id: 18, width: 0, height: 0 }, { id: 20, width: 0, height: 0 }, { id: 23, width: 0, height: 0 }, { id: 25, width: 0, height: 0 }, { id: 28, width: 3, height: 0 }, { id: 30, width: 0, height: 0 }], hierarchies: [{ leaves: [2, 8, 10, 13, 15, 18, 20, 23, 25, 28, 30], distMap: [[13, 15, 14], [8, 10, 14], [18, 20, 14], [28, 30, 14], [2, 8, 18], [2, 10, 22], [23, 25, 14], [13, 18, 30], [13, 20, 34], [15, 18, 34], [15, 20, 38], [2, 28, 22], [2, 30, 26], [8, 28, 30], [8, 30, 34], [10, 28, 34], [10, 30, 38], [2, 13, 34], [2, 15, 38], [2, 18, 30], [2, 20, 34], [8, 13, 42], [8, 15, 46], [8, 18, 38], [8, 20, 42], [10, 13, 46], [10, 15, 50], [10, 18, 42], [10, 20, 46], [28, 13, 38], [28, 15, 42], [28, 18, 34], [28, 20, 38], [30, 13, 42], [30, 15, 46], [30, 18, 38], [30, 20, 42], [2, 23, 26], [2, 25, 30], [8, 23, 34], [8, 25, 38], [10, 23, 38], [10, 25, 42], [28, 23, 30], [28, 25, 34], [30, 23, 34], [30, 25, 38], [13, 23, 34], [13, 25, 38], [15, 23, 38], [15, 25, 42], [18, 23, 30], [18, 25, 34], [20, 23, 34], [20, 25, 38]], parents: [] }] }, vec: [{ x: 0.5909090909090909, y: 0.6363636363636364 }, { x: 0.7121212121212122, y: 0.9090909090909091 }, { x: 0.9242424242424242, y: 0.9696969696969697 }, { x: 0.9696969696969697, y: 0.21212121212121213 }, { x: 1, y: 0 }, { x: 0.5151515151515151, y: 0.18181818181818182 }, { x: 0.3939393939393939, y: 0 }, { x: 0.19696969696969696, y: 0.5151515151515151 }, { x: 0, y: 0.42424242424242425 }, { x: 0.21212121212121213, y: 0.9696969696969697 }, { x: 0, y: 1 }] });
		const result = await bridge.solve(request);
		expect(result).to.deep.equal({
			width: 66, height: 66,
			flaps: [
				{ id: 2, x: 39, y: 42 }, { id: 8, x: 47, y: 60 }, { id: 10, x: 61, y: 64 }, { id: 13, x: 64, y: 14 },
				{ id: 15, x: 66, y: 0 }, { id: 18, x: 34, y: 12 }, { id: 20, x: 26, y: 0 }, { id: 23, x: 13, y: 34 },
				{ id: 25, x: 0, y: 28 }, { id: 28, x: 14, y: 64 }, { id: 30, x: 0, y: 66 },
			],
		});
	});

	it("Generates random layouts", async function() {
		const instance = await optimizer({
			print: () => undefined,
			checkInterrupt: () => false,
		});
		const bridge = new Bridge(instance);
		const request = makeRequest({ command: "start", useBH: false, layout: "random", random: 5, problem: { type: "rect", flaps: [{ id: 10, width: 5, height: 2 }, { id: 8, width: 0, height: 6 }, { id: 2, width: 0, height: 0 }, { id: 30, width: 0, height: 0 }, { id: 28, width: 3, height: 0 }, { id: 15, width: 0, height: 0 }, { id: 13, width: 0, height: 4 }, { id: 20, width: 0, height: 0 }, { id: 18, width: 0, height: 0 }, { id: 25, width: 0, height: 0 }, { id: 23, width: 0, height: 0 }], hierarchies: [{ leaves: [0, 4, 22], distMap: [[0, 4, 69.01106755734327], [0, 22, 53.998387826512555], [4, 22, 51.603940012804706]], parents: [] }, { leaves: [1, 27, 12, 17, 25, 23], distMap: [[1, 27, 44.31352822539935], [12, 17, 41.19206971762632], [25, 23, 14], [25, 1, 46.56414235524315], [25, 27, 39.749385870156196], [23, 1, 42.56414235524315], [23, 27, 35.749385870156196], [25, 12, 43.89643957663932], [25, 17, 39.295630140987], [23, 12, 39.89643957663932], [23, 17, 35.295630140987], [1, 12, 56.46058193188247], [1, 17, 51.85977249623015], [27, 12, 49.64582544679551], [27, 17, 45.0450160111432]], parents: [{ id: 0, radius: 35.702757685525555, children: [1, 27] }, { id: 4, radius: 33.308309871817706, children: [12, 17] }, { id: 22, radius: 18.295630140987, children: [25, 23] }] }, { leaves: [7, 2, 30, 28, 15, 13, 20, 18, 25, 23], distMap: [[15, 13, 15.142670058480405], [30, 28, 14.877864968295356], [20, 18, 14], [7, 2, 25.97646861407305], [25, 23, 14], [15, 20, 38], [15, 18, 34], [13, 20, 35.142670058480405], [13, 18, 31.142670058480405], [30, 7, 41.97646861407305], [30, 2, 26], [28, 7, 38.8543335823684], [28, 2, 22.877864968295352], [25, 30, 38], [25, 28, 34.877864968295356], [25, 7, 45.97646861407305], [25, 2, 30], [23, 30, 34], [23, 28, 30.877864968295352], [23, 7, 41.97646861407305], [23, 2, 26], [25, 15, 42], [25, 13, 39.142670058480405], [25, 20, 38], [25, 18, 34], [23, 15, 38], [23, 13, 35.142670058480405], [23, 20, 34], [23, 18, 30], [30, 15, 46], [30, 13, 43.142670058480405], [30, 20, 42], [30, 18, 38], [28, 15, 42.877864968295356], [28, 13, 40.020535026775754], [28, 20, 38.877864968295356], [28, 18, 34.877864968295356], [7, 15, 53.97646861407305], [7, 13, 51.11913867255345], [7, 20, 49.97646861407305], [7, 18, 45.97646861407305], [2, 15, 38], [2, 13, 35.142670058480405], [2, 20, 34], [2, 18, 30]], parents: [{ id: 1, radius: 25.564142355243153, children: [7, 2] }, { id: 27, radius: 18.749385870156196, children: [30, 28] }, { id: 12, radius: 22.896439576639317, children: [15, 13] }, { id: 17, radius: 18.295630140987, children: [20, 18] }] }, { leaves: [10, 8, 2, 30, 28, 15, 13, 20, 18, 25, 23], distMap: [[10, 8, 17.78922614932899], [15, 13, 15.142670058480405], [30, 28, 14.877864968295356], [20, 18, 14], [25, 23, 14], [10, 2, 24.14854898724473], [8, 2, 19.64067716208426], [15, 20, 38], [15, 18, 34], [13, 20, 35.142670058480405], [13, 18, 31.142670058480405], [30, 10, 40.14854898724473], [30, 8, 35.64067716208426], [30, 2, 26], [28, 10, 37.02641395554008], [28, 8, 32.518542130379615], [28, 2, 22.877864968295352], [25, 30, 38], [25, 28, 34.877864968295356], [25, 10, 44.14854898724473], [25, 8, 39.64067716208426], [25, 2, 30], [23, 30, 34], [23, 28, 30.877864968295352], [23, 10, 40.14854898724473], [23, 8, 35.64067716208426], [23, 2, 26], [25, 15, 42], [25, 13, 39.142670058480405], [25, 20, 38], [25, 18, 34], [23, 15, 38], [23, 13, 35.142670058480405], [23, 20, 34], [23, 18, 30], [30, 15, 46], [30, 13, 43.142670058480405], [30, 20, 42], [30, 18, 38], [28, 15, 42.877864968295356], [28, 13, 40.020535026775754], [28, 20, 38.877864968295356], [28, 18, 34.877864968295356], [10, 15, 52.14854898724473], [10, 13, 49.29121904572513], [10, 20, 48.14854898724473], [10, 18, 44.14854898724473], [8, 15, 47.64067716208426], [8, 13, 44.783347220564664], [8, 20, 43.64067716208426], [8, 18, 39.64067716208426], [2, 15, 38], [2, 13, 35.142670058480405], [2, 20, 34], [2, 18, 30]], parents: [{ id: 7, radius: 20.97646861407305, children: [10, 8] }] }] }, vec: null });
		const result = await bridge.solve(request, 427089946); // This example triggers ROUNDOFF_LIMITED
		expect(result).to.deep.equal({
			width: 76,
			height: 76,
			flaps: [
				{ id: 10, x: 22, y: 0 }, { id: 8, x: 1, y: 1 }, { id: 2, x: 40, y: 23 }, { id: 30, x: 76, y: 0 },
				{ id: 28, x: 67, y: 13 }, { id: 15, x: 0, y: 54 }, { id: 13, x: 0, y: 69 }, { id: 20, x: 36, y: 72 },
				{ id: 18, x: 36, y: 56 }, { id: 25, x: 72, y: 49 }, { id: 23, x: 72, y: 64 },
			],
		});
	});

	// This is the template for examine issues. Uncomment to use it.

	// it("test", async function() {
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

const simpleRequest = makeRequest({
	command: "start",
	problem: {
		type: GridType.rectangular,
		flaps: [
			{ id: 1, width: 0, height: 0 },
			{ id: 2, width: 0, height: 0 },
			{ id: 4, width: 0, height: 0 },
		],
		hierarchies: [
			{
				leaves: [1, 2, 4],
				distMap: [[1, 2, 16], [1, 4, 16], [2, 4, 12]],
				parents: [],
			},
		],
	},
	layout: "view",
	useBH: false,
	random: 0,
	vec: [{ x: 0.3, y: 0.3 }, { x: 0.4, y: 0.5 }, { x: 0.5, y: 0.4 }],
});

const simpleResult = {
	width: 15,
	height: 15,
	flaps: [
		{ id: 1, x: 0, y: 0 },
		{ id: 2, x: 6, y: 15 },
		{ id: 4, x: 15, y: 6 },
	],
};
