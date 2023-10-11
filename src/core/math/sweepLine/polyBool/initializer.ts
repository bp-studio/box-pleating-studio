import type { Polygon } from "shared/types/geometry";
import type { Comparator } from "shared/types/types";
import type { ISegment } from "../classes/segment/segment";

type LineConstructor = new (p1: IPoint, p2: IPoint, i: number) => ISegment;
type Callback = (segment: ISegment, delta: Sign) => void;

//=================================================================
/**
 * {@link Initializer} separates the initialization logic.
 */
//=================================================================
export class Initializer {

	private readonly _constructor: LineConstructor;

	/** The comparator used in determine the direction of a line during {@link $init}. */
	private readonly _comparator: Comparator<IPoint>;

	constructor(lineConstructor: LineConstructor, comparator: Comparator<IPoint>) {
		this._constructor = lineConstructor;
		this._comparator = comparator;
	}

	public $init(components: Polygon[], callback: Callback): void {
		for(let i = 0; i < components.length; i++) {
			const c = components[i];
			for(const path of c) {
				for(let j = 0; j < path.length; j++) {
					const p1 = path[j], p2 = path[(j + 1) % path.length];
					const segment = new this._constructor(p1, p2, i);
					const entering = this._comparator(p1, p2) < 0;
					callback(segment, entering ? 1 : -1);
				}
			}
		}
	}
}
