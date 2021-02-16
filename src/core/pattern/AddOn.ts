
interface JAddOn {
	contour: IPoint[];
	dir: IPoint;
}

//////////////////////////////////////////////////////////////////
/**
 * `AddOn` 是 `Device` 裡面的一個不屬於任何 `Gadget` 的 `Region`，
 * 特別是因為 standard join 而產生的。
 */
//////////////////////////////////////////////////////////////////

class AddOn extends Region implements JAddOn {

	public readonly contour: IPoint[];
	public readonly dir: IPoint;

	constructor(data: JAddOn) {
		super();
		this.contour = data.contour;
		this.dir = data.dir;
	}

	@onDemand public get shape() {
		let contour = this.contour.map(p => new Point(p));
		let ridges = contour.map((p, i, c) => new Line(p, c[(i + 1) % c.length]));
		return { contour, ridges };
	}

	@onDemand public get direction() {
		return new Vector(this.dir).reduceToInt();
	}

	public static instantiate(a: JAddOn): AddOn {
		return a instanceof AddOn ? a : new AddOn(a);
	}
}
