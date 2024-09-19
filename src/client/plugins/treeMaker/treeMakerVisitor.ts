
//=================================================================
/**
 * {@link TreeMakerVisitor} process each line of the file.
 */
//=================================================================
export class TreeMakerVisitor {
	private _lines: ArrayIterator<string>;

	constructor(data: string) {
		this._lines = data.split("\n").values();
	}

	public $next(): string {
		const next = this._lines.next().value;
		if(next === undefined) throw new Error();
		return next.trim();
	}
	public get $int(): number { return parseInt(this.$next(), 10); }
	public get $float(): number { return parseFloat(this.$next()); }
	public get $bool(): boolean { return this.$next() == "true"; }

	public $skip(n: number): void { for(let i = 0; i < n; i++) this._lines.next(); }
	public $skipArray(): void { this.$skip(this.$int); }
}
