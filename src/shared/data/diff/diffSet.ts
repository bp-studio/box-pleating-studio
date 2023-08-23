//=================================================================
/**
 * {@link DiffSet} is used to find the difference of a set between two rounds.
 */
//=================================================================
export class DiffSet<T> {

	private _oldSet: Set<T> = new Set();
	private _newSet: Set<T> = new Set();

	/** Signals the given value exists in the current round */
	public $add(value: T): void {
		this._newSet.add(value);
		this._oldSet.delete(value);
	}

	/** Return those old values that are absent in the current round since last called */
	public *$diff(): IterableIterator<T> {
		for(const value of this._oldSet) yield value;
		this._oldSet = this._newSet;
		this._newSet = new Set();
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Debug methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	///#if DEBUG
	public clear(): void {
		this._oldSet.clear();
		this._newSet.clear();
	}
	///#endif
}
