
//=================================================================
/**
 * {@link Store} manages the progress of a given {@link Generator}.
 */
//=================================================================
export class Store<T extends object> {

	private readonly _generator: Generator<T>;

	private readonly _entries: T[] = [];

	constructor(generator: Generator<T>) {
		this._generator = generator;
	}

	public get $entries(): readonly T[] {
		return this._entries;
	}

	public $next(): T | undefined {
		const next = this._generator.next();
		if(next.done) return undefined;
		const value = next.value;
		this._entries.push(value);
		return value;
	}

	public $rest(): void {
		let value = this.$next();
		while(value) value = this.$next();
	}
}
