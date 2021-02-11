
interface IRegionShape {

	/** Region 輪廓頂點 */
	contour: Path;

	/** Region 的輪廓邊，索引 i 的邊為從點 i 連至點 i+1 */
	ridges: Line[];
}

//////////////////////////////////////////////////////////////////
/**
 * `Region` 是單一軸平行區域。
 *
 * 這個東西只是抽象的計算類別，且沒有任何反應成份，因此不需要繼承任何東西。
 */
//////////////////////////////////////////////////////////////////

abstract class Region {

	public abstract get shape(): IRegionShape;

	/** 軸平行摺痕的方向 */
	public abstract get direction(): Vector;

	@onDemand public get axisParallels(): readonly Line[] {
		let ref = this.shape.contour.find(p => p.isIntegral)!;

		// 計算軸平行摺痕的設置範圍
		let dir = this.direction;
		let step = dir.rotate90().normalize();
		let min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY;
		for(let p of this.shape.contour) {
			let units = p.sub(ref).dot(step);
			if(units > max) max = units;
			if(units < min) min = units;
		}

		// 計算所有的軸平行摺痕
		let ap: Line[] = [];
		for(let i = Math.ceil(min); i <= Math.floor(max); i++) {
			let p = ref.add(step.scale(new Fraction(i)));
			let intersections: Point[] = [];
			for(let r of this.shape.ridges) {
				let j = r.intersection(p, dir);
				if(j && !j.eq(intersections[0])) intersections.push(j);
				if(intersections.length == 2) break;
			}
			if(intersections.length == 2) {
				ap.push(new Line(...intersections as [Point, Point]));
			}
		}
		return ap;
	}
}
