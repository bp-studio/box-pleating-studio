
import { Bridge } from "client/plugins/optimizer/bridge";
import { GridType } from "shared/json";

import type { OptimizerRequest, OptimizerResult } from "client/plugins/optimizer/types";
import type { OptimizerFactory } from "lib/optimizer/types";

/** Injected in mocha.env.mjs */
declare const optimizer: OptimizerFactory;

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
		const request = makeRequest({ command: "start", useBH: false, layout: "view", random: 5, problem: { type: "rect", flaps: [{ id: 2, width: 0, height: 0 }, { id: 8, width: 0, height: 6 }, { id: 10, width: 5, height: 2 }, { id: 13, width: 0, height: 4 }, { id: 15, width: 0, height: 0 }, { id: 18, width: 0, height: 0 }, { id: 20, width: 0, height: 0 }, { id: 23, width: 0, height: 0 }, { id: 25, width: 0, height: 0 }, { id: 28, width: 3, height: 0 }, { id: 30, width: 0, height: 0 }], hierarchies: [{ leaves: [2, 8, 10, 13, 15, 18, 20, 23, 25, 28, 30], distMap: [[13, 15, 14], [8, 10, 14], [18, 20, 14], [28, 30, 14], [2, 8, 18], [2, 10, 22], [23, 25, 14], [13, 18, 30], [13, 20, 34], [15, 18, 34], [15, 20, 38], [2, 28, 22], [2, 30, 26], [8, 28, 30], [8, 30, 34], [10, 28, 34], [10, 30, 38], [2, 13, 34], [2, 15, 38], [2, 18, 30], [2, 20, 34], [8, 13, 42], [8, 15, 46], [8, 18, 38], [8, 20, 42], [10, 13, 46], [10, 15, 50], [10, 18, 42], [10, 20, 46], [28, 13, 38], [28, 15, 42], [28, 18, 34], [28, 20, 38], [30, 13, 42], [30, 15, 46], [30, 18, 38], [30, 20, 42], [2, 23, 26], [2, 25, 30], [8, 23, 34], [8, 25, 38], [10, 23, 38], [10, 25, 42], [28, 23, 30], [28, 25, 34], [30, 23, 34], [30, 25, 38], [13, 23, 34], [13, 25, 38], [15, 23, 38], [15, 25, 42], [18, 23, 30], [18, 25, 34], [20, 23, 34], [20, 25, 38]], parents: [] }] }, vec: [{ x: 0.5909090909090909, y: 0.6363636363636364 }, { x: 0.7121212121212122, y: 0.9090909090909091 }, { x: 0.9242424242424242, y: 0.9696969696969697 }, { x: 0.9696969696969697, y: 0.21212121212121213 }, { x: 1, y: 0 }, { x: 0.5151515151515151, y: 0.18181818181818182 }, { x: 0.3939393939393939, y: 0 }, { x: 0.19696969696969696, y: 0.5151515151515151 }, { x: 0, y: 0.42424242424242425 }, { x: 0.21212121212121213, y: 0.9696969696969697 }, { x: 0, y: 1 }] });
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
