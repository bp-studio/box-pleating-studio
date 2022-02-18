import { Region } from "./Region";
import { Line, Point, Vector } from "bp/math";
import { onDemand } from "bp/global";
import type { JAddOn } from "bp/content/json";
import type { IPoint } from "bp/math";

interface IShape {
	contour: Point[];
	ridges: Line[];
}

//=================================================================
/**
 * {@link AddOn} 是 {@link Device} 裡面的一個不屬於任何 {@link Gadget} 的 {@link Region}，
 * 特別是因為 standard join 而產生的。
 */
//=================================================================

export class AddOn extends Region implements JAddOn {

	public readonly contour: IPoint[];
	public readonly dir: IPoint;

	constructor(data: JAddOn) {
		super();
		this.contour = data.contour;
		this.dir = data.dir;
	}

	@onDemand public get $shape(): IShape {
		let contour = this.contour.map(p => new Point(p));
		let ridges = contour.map((p, i, c) => new Line(p, c[(i + 1) % c.length]));
		return { contour, ridges };
	}

	@onDemand public get $direction(): Vector {
		return new Vector(this.dir).$reduceToInt();
	}

	public static $instantiate(a: JAddOn): AddOn {
		return a instanceof AddOn ? a : new AddOn(a);
	}
}
