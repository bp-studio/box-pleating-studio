import { getKey, getPair } from "./intDoubleMap";

export class DiffDoubleSet {

	private _oldSet: Set<number> = new Set();
	private _newSet: Set<number> = new Set();

	public $add(a: number, b: number): void {
		const key = getKey(a, b);
		this._newSet.add(key);
		this._oldSet.delete(key);
	}

	public *$diff(): IterableIterator<[number, number]> {
		for(const key of this._oldSet) yield getPair(key);
		this._oldSet = this._newSet;
		this._newSet = new Set();
	}
}
