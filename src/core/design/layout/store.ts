
//=================================================================
/**
 * {@link Store} manages the progress of a given {@link Generator}.
 */
//=================================================================
export class Store<T extends object> {

	private readonly _generator: Generator<T>;

	private readonly _entries: T[] = [];

	/** Whether the {@link _generator} has been exhausted. */
	private _done: boolean = false;

	constructor(generator: Generator<T>) {
		this._generator = generator;
	}

	/** The number of entries, or `undefined` if not completed yet. */
	public get $length(): number | undefined {
		return this._done ? this.$entries.length : undefined;
	}

	/** The array of the generated entries (may be incomplete). */
	public get $entries(): readonly T[] {
		return this._entries;
	}

	/**
	 * Return a {@link Generator} for the generated entries,
	 * as well as remaining entries.
	 */
	public *$values(): Generator<T> {
		for(const entry of this._entries) yield entry;
		while(!this._done) {
			const entry = this.$next();
			if(entry) yield entry;
		}
	}

	/** Return the next entry, if any. */
	public $next(): T | undefined {
		const next = this._generator.next();
		if(next.done) {
			this._done = true;
			return undefined;
		}
		const value = next.value;
		this._entries.push(value);
		return value;
	}

	/** Exhaust the generator. */
	public $rest(): void {
		while(!this._done) this.$next();
	}
}
