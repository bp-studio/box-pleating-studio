
//////////////////////////////////////////////////////////////////
/**
 * {@link JoinCandidate} 是融合過程當中其中一個參與者的抽象化物件；
 * 這裡面分攤了 {@link JoinerCore} 的部份程式碼。
 */
//////////////////////////////////////////////////////////////////

class JoinCandidate {

	public readonly p: Piece;
	public readonly o: IPoint;
	public readonly a: JAnchor[];
	public readonly v: Vector;
	public readonly pt: IPoint
	public readonly e: Line

	constructor(
		p: Piece,
		offset: IPoint,
		a: JAnchor[],
		pt: Point,
		q: QuadrantDirection,
		additionalOffset: Vector = Vector.ZERO
	) {
		this.p = p;
		this.o = offset;
		this.a = a;
		this.v = new Vector(offset).addBy(additionalOffset).neg;
		this.pt = pt.add(this.v).$toIPoint();
		this.e = p.$shape.ridges[q].$shift(additionalOffset);
	}

	public $setupDetour(rawDetour: Point[], reverse: boolean) {
		let detour = rawDetour.map(p => p.add(this.v).$toIPoint());
		detour.push(this.pt);
		if(reverse) detour.reverse();
		this.p.$clearDetour();
		this.p.$addDetour(detour);
	}

	public $toGadget(json?: boolean, offset?: IPoint): JGadget {
		let off: IPoint|undefined = this.o;
		if(offset) {
			off.x += offset.x; off.y += offset.y;
		}
		if(off.x == 0 && off.y == 0) off = undefined;
		return {
			pieces: [json ? this.p.toJSON() : this.p],
			offset: off,
			anchors: this.a.concat(), // 必須複製一份，因為 this.a 還會繼續被使用
		};
	}

	public $isSteeperThan(that: JoinCandidate) {
		return this.p.$direction.$slope.gt(that.p.$direction.$slope);
	}

	public $setupAnchor(upperLeft: boolean, anchor: Point) {
		let q = upperLeft ? Direction.UL : Direction.LR;
		// 因為每次寫入的位置其實都是一樣的，所以這邊不用擔心垃圾資料惠存活到下一次
		this.a[q] = { location: anchor.add(this.v).$toIPoint() };
	}
}
