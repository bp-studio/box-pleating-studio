import type { OptimizerRequest, OptimizerResult } from "./types";
import type { OptimizerInstance } from "lib/optimizer/types";

const UINT_MAX = 4294967295; // Max value of unsigned int

//=================================================================
/**
 * {@link Bridge} communicates between JavaScript and WASM.
 */
//=================================================================
export class Bridge {

	private _instance: OptimizerInstance;

	constructor(instance: OptimizerInstance, async: boolean = false) {
		this._instance = instance;
		instance.init(async);
	}

	public async solve(request: OptimizerRequest, seed?: number): Promise<OptimizerResult> {
		if(seed === undefined || !Number.isInteger(seed) || seed > UINT_MAX) {
			seed = Math.floor(Math.random() * UINT_MAX);
		}

		const data = makeData(request);
		const response = await this._instance.solve(data, seed);
		const size = response.size();
		if(!size) throw new Error("No solution found.");
		const grid = response.get(size - 1);
		const result: OptimizerResult = {
			width: grid,
			height: grid,
			flaps: request.problem.flaps.map((f, i) => ({
				id: f.id,
				x: response.get(2 * i),
				y: response.get(2 * i + 1),
			})),
		};
		response.delete(); // release memory
		return result;
	}
}

function makeData(request: OptimizerRequest): object {
	const { problem } = request;
	const data: Record<string, unknown> = {
		type: problem.type == "rect" ? 1 : 2,
		hierarchies: problem.hierarchies,
		flaps: problem.flaps,
	};
	const useView = request.layout == "view";
	data.useView = useView;
	if(useView) {
		data.vec = request.vec!;
		data.useBH = request.useBH;
	} else {
		data.random = request.random;
	}
	return data;
}
