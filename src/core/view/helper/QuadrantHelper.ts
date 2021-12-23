import { Fraction, PolyBool, Rectangle, Vector } from "bp/math";
import { path, shape } from "bp/global";
import { Disposable } from "bp/class";
import type { Path } from "bp/math";
import type { Quadrant } from "bp/design";
import type { RiverHelperBase } from "./RiverHelperBase";

//////////////////////////////////////////////////////////////////
/**
 * {@link QuadrantHelper} 負責輔助管理 {@link Quadrant} 的輪廓。
 */
//////////////////////////////////////////////////////////////////

@shrewd export class QuadrantHelper extends Disposable {

	private _quadrant: Quadrant;

	constructor(private parent: RiverHelperBase, q: number) {
		super(parent);
		this._quadrant = parent.$flap.$quadrants[q];
	}

	/** 在找出延伸河道輪廓的時候，應該被扣除的不該考慮部份 */
	@shape("qo") public get $overridden(): PolyBool.Shape | null {
		this.$disposeEvent();
		let result: PolyBool.Shape[] = [];
		let d = this.parent.$distance;
		let { qv, fx, fy, $point: point, $coveredInfo: coveredInfo, $pattern: pattern } =
			this._quadrant;

		if(!pattern) {
			let r = new Fraction(this.parent.$flap.radius + d);
			let p = point.add(qv.$scale(r));

			for(let [ox, oy, pts] of coveredInfo) {

				// 扣除的部份不要超過覆蓋者所能夠繪製的輪廓範圍，否則會扣太多
				for(let pt of pts) {
					let diff = p.sub(pt);
					ox = Math.min(diff.x * fx, ox);
					oy = Math.min(diff.y * fy, oy);
				}

				// 如果結果非正那就不用考慮
				if(ox <= 0 || oy <= 0) continue;

				let v = new Vector(ox * fx, oy * fy);
				let rect = new Rectangle(p, p.sub(v));
				let region = rect.$toPolyBoolPath();
				let seg = PolyBool.toShape({ regions: [region], inverted: false });
				result.push(seg);
			}
		}
		return result.length ? PolyBool.union(result) : null;
	}

	@path("qc") public get $contour(): Path {
		this.$disposeEvent();
		return this._quadrant.$makeContour(this.parent.$distance);
	}
}
