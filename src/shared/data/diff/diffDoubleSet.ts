import { getKey, getPair } from "../doubleMap/intDoubleMap";

//=================================================================
/**
 * {@link DiffDoubleSet} is used to find the difference of a double-key set between two rounds.
 */
//=================================================================
export class DiffDoubleSet {

	private _oldSet: Set<number> = new Set();
	private _newSet: Set<number> = new Set();

	/** Signals the given key pair exists in the current round */
	public $add(a: number, b: number): void {
		const key = getKey(a, b);
		this._newSet.add(key);
		this._oldSet.delete(key);
	}

	/** Return those old key pairs that are absent in the current round since last called */
	public *$diff(): IterableIterator<[number, number]> {
		for(const key of this._oldSet) yield getPair(key);
		this._oldSet = this._newSet;
		this._newSet = new Set();
	}
}
