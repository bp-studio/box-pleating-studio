
@shrewd class QuadrantHelper extends Disposable {

	private quadrant: Quadrant;

	constructor(private parent: RiverHelperBase, q: number) {
		super(parent);
		this.quadrant = parent.flap.quadrants[q];
	}

	/** 在找出延伸河道輪廓的時候，應該被扣除的不該考慮部份 */
	@segment("qo") public get overridden(): PolyBool.Segments | null {
		this.disposeEvent();
		let result: PolyBool.Segments[] = [];
		let d = this.parent.distance;
		let { qv, fx, fy, point, coveredJunctions, pattern } = this.quadrant;
		if(!pattern) {
			let r = this.parent.flap.radius + d;
			for(let [j, pts] of coveredJunctions) {
				let { ox, oy } = j;
				let p = point.add(qv.scale(r));

				// 扣除的部份不要超過覆蓋者所能夠繪製的輪廓範圍，否則會扣太多
				for(let pt of pts) {
					let diff = pt.sub(p);
					ox = Math.min(-diff.x * fx, ox);
					oy = Math.min(-diff.y * fy, oy);
				}

				// 如果結果非正那就不用考慮
				if(ox <= 0 || oy <= 0) continue;

				let v = new Vector(ox * fx, oy * fy);
				let rect = new Rectangle(p, p.sub(v));
				let path = rect.toPolyBoolPath();
				let seg = PolyBool.segments({ regions: [path], inverted: false });
				result.push(seg);
			}
		}
		return result.length ? PolyBool.union(result) : null;
	}

	@path("qc") public get contour() {
		this.disposeEvent();
		return this.quadrant.makeContour(this.parent.distance);
	}
}
