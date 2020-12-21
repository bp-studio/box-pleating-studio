
type JoinResult = [JDevice, number];

//////////////////////////////////////////////////////////////////
/**
 * `Joiner` 負責在融合的工作中搜尋可能的 `Gadget` 對並且加以暫存。
 */
//////////////////////////////////////////////////////////////////

class Joiner {

	private g1: JPiece[];
	private g2: JPiece[];
	public s1?: IPoint;
	public s2?: IPoint;

	/** 共用角在左下角 */
	public oriented: boolean;

	/** 從 p1 到 p2 是順時鐘 */
	public cw: boolean;
	public intDist: number;

	// 四種情況中的選邊組合
	public q1: QuadrantDirection;
	public q2: QuadrantDirection;

	/** 共用角的方向 */
	public q: QuadrantDirection;

	constructor(overlaps: readonly JOverlap[], repo: Repository) {
		let junctions: JJunction[] = [];
		let [o1, o2] = overlaps;
		if(o1.ox == o2.ox || o1.oy == o2.oy) return; // 這種情況是絕對非法的，不用繼續了

		[this.g1, this.g2] = overlaps.map(o => {
			let j = repo.structure[o.parent];
			junctions.push(j);
			return Array.from(Piece.gops(o, j.sx));
		});
		let [j1, j2] = junctions;
		this.oriented = j1.c[0].e == j2.c[0].e;
		this.cw = o1.ox > o2.ox;
		this.q = this.oriented ? 0 : 2;
		[this.q1, this.q2] = this.oriented ? (this.cw ? [2, 1] : [1, 2]) : (this.cw ? [0, 3] : [3, 0]);
		this.intDist = Partitioner.getMaxIntersectionDistance(repo.sheet.design.tree, j1, j2, this.oriented);

		// 計算 Overlap 偏移
		[this.s1, this.s2] = this.oriented ?
			[o1.shift, o2.shift] :
			[this.getReverseShift(o1, j1), this.getReverseShift(o2, j2)];
	}

	private *join(
		generator: (core: JoinerCore) => Generator<JoinResult>,
		precondition?: (P1: Piece, P2: Piece) => boolean
	): Generator<JDevice> {
		let { g1, g2 } = this;
		let result: [JDevice, number][] = [];
		if(!g1) return;
		for(let p1 of g1) {
			for(let p2 of g2) {
				let P1 = Piece.instantiate(p1, true);
				let P2 = Piece.instantiate(p2, true);
				if(precondition && !precondition(P1, P2)) continue;
				result.push(...generator(new JoinerCore(this, P1, P2)));
			}
		}
		result.sort((a, b) => a[1] - b[1]);
		for(let [j] of result) yield j;
	}

	public *simpleJoin(strategy?: Strategy): Generator<JDevice> {
		let { s1, s2 } = this;
		yield* this.join(j => j.simpleJoin(), (P1, P2) => {
			let parallel = P1.direction.parallel(P2.direction);
			if(strategy == Strategy.perfect && !parallel) return false;
			if((s1 || s2) && parallel) return false;
			return true;
		});
	}

	public *baseJoin(): Generator<JDevice> {
		yield* this.join(j => j.baseJoin());
	}

	public *standardJoin(): Generator<JDevice> {
		let { s1, s2 } = this, shift = !!s1 || !!s2;
		let counter = 0;
		yield* this.join(j => j.standardJoin(), (P1, P2) => {
			return shift || counter++ == 0; // 只會傳回第一個
		});
	}

	private getReverseShift(o: JOverlap, j: JJunction): IPoint | undefined {
		let x = o.ox + (o.shift?.x ?? 0), y = o.oy + (o.shift?.y ?? 0);
		if(x == j.ox && y == j.oy) return undefined;
		return { x: x - j.ox, y: y - j.oy }; // 注意到這邊故意傳回負值
	}

	public getRelayJoinIntersection(p: Piece, s: IPoint, n: number) {
		let testVector = this.oriented ? new Vector(1, 1) : new Vector(-1, -1);
		let pt = p.anchors[this.q]!.sub(new Vector(s));
		return p.shape.ridges[n].intersection(pt, testVector);
	}
}
