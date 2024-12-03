
import { Bridge } from "client/plugins/optimizer/bridge";
import { id1, id2, id4 } from "@utils/tree";
import { GridType } from "shared/json";

import type { OptimizerRequest, OptimizerResult } from "client/plugins/optimizer/types";
import type { OptimizerFactory } from "lib/optimizer/types";

declare const optimizer: OptimizerFactory;

// Changes made to the C++ part will take effect after `make`

describe("Optimizer", function() {

	it("Solve SLSQP", async function() {
		const instance = await optimizer({
			print: () => undefined,
			checkInterrupt: () => false,
		});
		const bridge = new Bridge(instance);
		const result = await bridge.solve(sampleRequest);
		expect(result).to.deep.equal(sampleResult);
	});

	it("Runs in async mode", async function() {
		const instance = await optimizer({
			print: () => undefined,
			checkInterruptAsync: () => Promise.resolve(false),
		});
		const bridge = new Bridge(instance, true);
		const result = await bridge.solve(sampleRequest);
		expect(result).to.deep.equal(sampleResult);
	});

});

const sampleRequest: OptimizerRequest = {
	command: "start",
	problem: {
		type: GridType.rectangular,
		flaps: [
			{ id: id1, width: 0, height: 0 },
			{ id: id2, width: 0, height: 0 },
			{ id: id4, width: 0, height: 0 },
		],
		hierarchies: [
			{
				leaves: [id1, id2, id4],
				distMap: [[id1, id2, 16], [id1, id4, 16], [id2, id4, 12]],
				parents: [],
			},
		],
	},
	layout: "view",
	useBH: false,
	random: 0,
	vec: [{ x: 0.3, y: 0.3 }, { x: 0.4, y: 0.5 }, { x: 0.5, y: 0.4 }],
};

const sampleResult: OptimizerResult = {
	width: 15,
	height: 15,
	flaps: [
		{ id: id1, x: 0, y: 0 },
		{ id: id2, x: 6, y: 15 },
		{ id: id4, x: 15, y: 6 },
	],
};
