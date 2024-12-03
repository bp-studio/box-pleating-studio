import type { OptimizerRequest, OptimizerResult } from "./types";
import type { OptimizerInstance } from "lib/optimizer/types";

//=================================================================
/**
 * {@link Bridge} communicates between JavaScript and WASM.
 */
//=================================================================
export class Bridge {

	constructor(
		private instance: OptimizerInstance,
		private async: boolean = false
	) {
		instance._init(async);
	}

	public async solve(data: OptimizerRequest): Promise<OptimizerResult> {
		const arr = serialize(data);
		const ptr = this._createDoubleArrayPointer(arr);
		// We need to use ccall to return a Promise in async mode
		const awaitable = this.instance.ccall("solve", "number", ["number"], [ptr], { async: this.async }) as Awaitable<number>;
		const outputPtr = await awaitable;
		const response = this._parseIntArray(outputPtr);
		if(!response.length) throw new Error("No solution found.");
		const grid = response[response.length - 1];
		const result: OptimizerResult = {
			width: grid,
			height: grid,
			flaps: data.problem.flaps.map((f, i) => ({
				id: f.id,
				x: response[2 * i],
				y: response[2 * i + 1],
			})),
		};
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _createDoubleArrayPointer(jsArray: number[]): number {
		const arrayLength = jsArray.length;
		const arrayBytes = arrayLength * Float64Array.BYTES_PER_ELEMENT;
		const arrayPtr = this.instance._malloc(arrayBytes);
		this.instance.HEAPF64.set(jsArray, arrayPtr / Float64Array.BYTES_PER_ELEMENT);
		return arrayPtr;
	}

	private _parseIntArray(ptr: number): number[] {
		// There's no need to free memory here.
		const output = Array.from(new Int32Array(this.instance.HEAP32.buffer, ptr, 2));
		return Array.from(new Int32Array(this.instance.HEAP32.buffer, output[1], output[0]));
	}
}

function serialize(data: OptimizerRequest): number[] {
	const { problem } = data;
	const result: number[] = [];
	result.push(problem.type == "rect" ? 1 : 2);
	result.push(problem.hierarchies.length);
	for(const h of problem.hierarchies) {
		result.push(h.leaves.length);
		result.push(...h.leaves);
		result.push(h.distMap.length);
		for(const d of h.distMap) result.push(...d);
		result.push(h.parents.length);
		for(const p of h.parents) {
			result.push(p.id, p.radius, p.children.length, ...p.children);
		}
	}
	result.push(problem.flaps.length);
	for(const f of problem.flaps) {
		result.push(f.id, f.width, f.height);
	}

	const useView = data.layout == "view";
	result.push(Number(useView));
	if(useView) {
		for(const p of data.vec!) result.push(p.x, p.y);
		result.push(Number(data.useBH));
	} else {
		result.push(data.random);
	}
	return result;
}
