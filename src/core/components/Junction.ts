
interface JJunction extends JRectangle {
	/** 對應的兩個 Flap 之間的最大空間，恆正 */
	sx: number;
}

//////////////////////////////////////////////////////////////////
/**
 * `Junction` 是負責管理兩個 `Flap` 之間的相對狀態的抽象物件。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Junction extends SheetObject implements ISerializable<JJunction> {

	/**
	 * 針對一個 `Junction` 群組產生簽章 id；
	 * 目前採用的格式是直接依 `Flap` 的 id 照順序以逗點分隔。
	 * 實務上這樣決定出來的 `Junction` 群組必然是唯一的。
	 * @param idFactory 可以用來決定是以 id 或用 jid 來產
	 */
	public static createTeamId(arr: readonly Junction[], idFactory: (f: Flap) => number) {
		let set = new Set<number>();
		arr.forEach(o => {
			set.add(idFactory(o.f1));
			set.add(idFactory(o.f2));
		});
		return Array.from(set).sort((a, b) => a - b).join(",");
	}

	/** `Junction` 群組用的排序函數 */
	public static sort(j1: Junction, j2: Junction): number {
		let d = j1.f1.node.id - j2.f1.node.id;
		if(d != 0) return d;
		else return j1.f2.node.id - j2.f2.node.id;
	}

	/** `Junction` 的兩個 `Flap` 當中 id 較小者 */
	public readonly f1: Flap;

	/** `Junction` 的兩個 `Flap` 當中 id 較大者 */
	public readonly f2: Flap;

	/** 識別 id；其格式是「n1:n2」，而 n1 < n2 是對應 `TreeNode` 的 id。 */
	public readonly id: string;

	constructor(sheet: Sheet, f1: Flap, f2: Flap) {
		super(sheet);
		if(f1.node.id > f2.node.id) [f1, f2] = [f2, f1];
		this.f1 = f1;
		this.f2 = f2;
		this.id = f1.node.id + ":" + f2.node.id;
		new JunctionView(this);
	}

	protected get shouldDispose(): boolean {
		return super.shouldDispose || this.f1.disposed || this.f2.disposed;
	}

	/** 根據指定的基準點來取得覆蓋比較矩形 */
	private getBaseRectangle(base: TreeNode): Rectangle | undefined {
		let q = this.sx > 0 ? this.q2 : this.q1;
		return q?.getBaseRectangle(this, base);
	}

	@shrewd private get _lca(): TreeNode {
		this.disposeEvent();
		let n1 = this.f1.node, n2 = this.f2.node;
		return n1.tree.pair.get(n1, n2)!.lca;
	}

	private findIntersection(j: Junction): TreeNode | null {
		let n1 = this._lca, n2 = j._lca;
		if(n1 == n2) return n1;
		let n3 = n1.tree.pair.get(n1, n2)!.lca;
		if(n3 != n1 && n3 != n2) return null;
		return n3 == n1 ? n2 : n1;
	}

	/** 判斷自身是否被另外一個 `Junction` 所涵蓋 */
	private isCoveredBy(o: Junction): boolean {
		// 方向不一樣的話肯定不是覆蓋
		if(this == o || this.direction % 2 != o.direction % 2) return false;

		// 找出對應路徑上的一個共用點，如果沒有的話肯定不是覆蓋
		let n = this.findIntersection(o);
		if(!n) return false;

		// 基底矩形檢查
		let [r1, r2] = [o.getBaseRectangle(n), this.getBaseRectangle(n)];
		if(!r1 || !r2 || !r1.contains(r2)) return false;

		if(r1.equals(r2)) {
			// 如果兩者完全一樣大，則比較近的覆蓋比較遠的
			return Math.abs(o.sx) < Math.abs(this.sx) || Math.abs(o.sy) < Math.abs(this.sy);
		}
		return true; // 否則大的覆蓋小的
	}

	@shrewd public get coveredBy(): Junction[] {
		this.disposeEvent();
		if(!this.isValid) return [];
		return this.sheet.design.validJunctions.filter(j => this.isCoveredBy(j));
	}

	@shrewd public get isCovered(): boolean {
		this.disposeEvent();
		return this.coveredBy.some(j => j.coveredBy.length == 0);
	}

	public toJSON(): JJunction {
		return {
			c: [
				{ type: CornerType.flap, e: this.f1.node.id, q: this.q1!.q },
				{ type: CornerType.side },
				{ type: CornerType.flap, e: this.f2.node.id, q: this.q2!.q },
				{ type: CornerType.side }
			],
			ox: this.ox,
			oy: this.oy,
			sx: this.sx < 0 ? -this.sx : this.sx
		};
	}

	@shrewd public get neighbors() {
		this.disposeEvent();
		if(this.direction > 3) return [];
		let a1 = this.q1!.activeJunctions.concat();
		let a2 = this.q2!.activeJunctions.concat();
		a1.splice(a1.indexOf(this), 1);
		a2.splice(a2.indexOf(this), 1);
		return a1.concat(a2);
	}

	@shrewd public get q1() {
		return isQuadrant(this.direction) ? this.f1.quadrants[this.direction] : null;
	}

	@shrewd public get q2() {
		return isQuadrant(this.direction) ? this.f2.quadrants[opposite(this.direction)] : null;
	}

	@shrewd public get $treeDistance() {
		this.disposeEvent();
		let n1 = this.f1.node, n2 = this.f2.node;
		return n1.tree.dist(n1, n2);
	}

	@shrewd public get status() {
		if(this._flapDistance < this.$treeDistance) return JunctionStatus.tooClose;
		else if(this.ox && this.oy) return JunctionStatus.overlap;
		else return JunctionStatus.tooFar;
	}

	/** 「f」在這邊是代表乘法係數。 */
	@shrewd public get fx() {
		return -Math.sign(this.sx);
	}

	/** 「f」在這邊是代表乘法係數。 */
	@shrewd public get fy() {
		return -Math.sign(this.sy);
	}

	/** 「o」是代表重疊區域。 */
	@shrewd public get ox() {
		let x = this.$treeDistance - Math.abs(this.sx);
		return x > 0 ? x : NaN;
	}

	/** 「o」是代表重疊區域。 */
	@shrewd public get oy() {
		let y = this.$treeDistance - Math.abs(this.sy);
		return y > 0 ? y : NaN;
	}

	/** 「s」是代表角片尖端構成的方框。這個值可能是負值，視 f1 f2 相對位置而定。 */
	@shrewd public get sx() {
		let x1 = this.f1.location.x, x2 = this.f2.location.x;
		let w1 = this.f1.width, w2 = this.f2.width;
		let sx = x1 - x2 - w2;
		if(sx >= 0) return sx;
		sx = x1 + w1 - x2;
		if(sx <= 0) return sx;
		return NaN;
	}

	/** 「s」是代表角片尖端構成的方框。這個值可能是負值，視 f1 f2 相對位置而定。 */
	@shrewd public get sy() {
		let y1 = this.f1.location.y, y2 = this.f2.location.y;
		let h1 = this.f1.height, h2 = this.f2.height;
		let sy = y1 - y2 - h2;
		if(sy >= 0) return sy;
		sy = y1 + h1 - y2;
		if(sy <= 0) return sy;
		return NaN;
	}

	@shrewd public get direction() {
		let x = this.sx, y = this.sy;
		if(x < 0 && y < 0) return Direction.UR;
		if(x > 0 && y < 0) return Direction.UL;
		if(x > 0 && y > 0) return Direction.LL;
		if(x < 0 && y > 0) return Direction.LR;
		if(x < 0) return Direction.R;
		if(x > 0) return Direction.L;
		if(y < 0) return Direction.T;
		if(y > 0) return Direction.B;
		return Direction.none;
	}

	@shrewd private get _flapDistance() {
		let x = this.sx, y = this.sy;
		let vx = x != 0 && !isNaN(x), vy = y != 0 && !isNaN(y);
		if(vx && vy) return Math.sqrt(x * x + y * y);
		if(vx) return Math.abs(x);
		if(vy) return Math.abs(y);
		return 0;
	}

	/** 目前 isValid 的定義就是正常的 overlap */
	@shrewd public get isValid(): boolean {
		return this.status == JunctionStatus.overlap;

		// 有待釐清：原本有加上這個條件，但是有需要如此嚴苛嗎？
		// && this.q1!.isValid && this.q2!.isValid;
	}

	/**
	 * 找出給定的 `Junction[]` 裡面 ox 或 oy 最大或最小的
	 * @param f 傳入 1 表示要找最大、-1 表示要找最小
	 */
	public static findMinMax(junctions: readonly Junction[], key: JunctionDimension, f: number): Junction {
		let value = junctions[0][key];
		let result: Junction = junctions[0];
		for(let j = 1; j < junctions.length; j++) if(junctions[j][key] * f > value * f) {
			result = junctions[j];
			value = junctions[j][key];
		}
		return result;
	}
}

type JunctionDimension = 'ox' | 'oy';
