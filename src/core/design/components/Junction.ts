
interface JJunction extends JQuadrilateral {
	/** 對應的兩個 {@link Flap} 之間的最大空間，恆正 */
	sx: number;
}

/** {@link Junction} 的重疊狀態 */
enum JunctionStatus {
	/** 兩者重疊過頭 */
	tooClose,
	/** 兩者合法重疊 */
	overlap,
	/** 兩者沒有重疊 */
	tooFar,
}

type JunctionDimension = 'ox' | 'oy';

//////////////////////////////////////////////////////////////////
/**
 * {@link Junction} 是負責管理兩個 {@link Flap} 之間的相對狀態的抽象物件。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Junction extends SheetObject implements ISerializable<JJunction> {

	/**
	 * 針對一個 {@link Junction} 群組產生簽章 id；
	 * 目前採用的格式是直接依 {@link Flap} 的 {@link TreeNode.id id} 照順序以逗點分隔。
	 * 實務上這樣決定出來的 {@link Junction} 群組必然是唯一的。
	 */
	public static $createTeamId(arr: readonly Junction[]): string {
		let set = new Set<number>();
		arr.forEach(o => {
			set.add(o.f1.node.id);
			set.add(o.f2.node.id);
		});
		return Array.from(set).sort((a, b) => a - b).join(",");
	}

	/** {@link Junction} 群組用的排序函數 */
	public static $sort(j1: Junction, j2: Junction): number {
		let d = j1.f1.node.id - j2.f1.node.id;
		if(d != 0) return d;
		else return j1.f2.node.id - j2.f2.node.id;
	}

	/** {@link Junction} 的兩個 {@link Flap} 當中 id 較小者 */
	public readonly f1: Flap;

	/** {@link Junction} 的兩個 {@link Flap} 當中 id 較大者 */
	public readonly f2: Flap;

	constructor(sheet: Sheet, f1: Flap, f2: Flap) {
		super(sheet);
		if(f1.node.id > f2.node.id) [f1, f2] = [f2, f1];
		this.f1 = f1;
		this.f2 = f2;
		f1._junctions.push(this);
		f2._junctions.push(this);
		this.$design.$viewManager.$createView(this);
	}

	protected get $shouldDispose(): boolean {
		return super.$shouldDispose || this.f1.$disposed || this.f2.$disposed;
	}

	protected $onDispose(): void {
		this.f1._junctions.splice(this.f1._junctions.indexOf(this), 1);
		this.f2._junctions.splice(this.f2._junctions.indexOf(this), 1);
		super.$onDispose();
	}

	/** 根據指定的基準點來取得覆蓋比較矩形 */
	private _getBaseRectangle(base: TreeNode): Rectangle | undefined {
		let q = this.sx > 0 ? this.q2 : this.q1;
		return q?.$getBaseRectangle(this, base);
	}

	@shrewd private get _lca(): TreeNode {
		this.$disposeEvent();
		return this.$design.$tree.lca(this.n1, this.n2);
	}

	private get n1(): TreeNode { return this.f1.node; }
	private get n2(): TreeNode { return this.f2.node; }

	/**
	 * 找出對應路徑上的一個共用點。
	 *
	 * 目前的演算法用了 LCA 的原理來尋找，雖然理論上速度 OK，
	 * 但是會使得 {@link Junction._coverCandidate _coverCandidate} 大量相依於頂點的 path，所以也不能說很理想。
	 * 日後可以再思考改進的方法。
	 */
	private _findIntersection(j: Junction): TreeNode | null {
		let a1 = this._lca, a2 = j._lca;
		let tree = this.$design.$tree;
		if(a1 == a2) return a1;

		if(a1.$depth > a2.$depth) {
			if(tree.lca(a1, j.n1) == a1 || tree.lca(a1, j.n2) == a1) return a1;
		} else if(a2.$depth > a1.$depth) {
			if(tree.lca(a2, this.n1) == a2 || tree.lca(a2, this.n2) == a2) return a2;
		}
		return null;
	}

	/** 自身有可能被覆蓋的 {@link Junction} 列表 */
	@shrewd({
		comparer(ov: [Junction, TreeNode][], nv: [Junction, TreeNode][]) {
			if(!ov) return false;
			if(ov.length != nv.length) return false;
			for(let i = 0; i < ov.length; i++) {
				if(ov[i][0] != nv[i][0] || ov[i][1] != nv[i][1]) return false;
			}
			return true;
		},
	})
	private get _coverCandidate(): [Junction, TreeNode][] {
		let result: [Junction, TreeNode][] = [];
		for(let j of this.$sheet.$design.$junctions.$valid) {
			if(j == this) continue;
			// 若對應路徑沒有共用點（亦即路徑不重疊）則肯定沒有覆蓋
			let n = this._findIntersection(j);
			if(n) result.push([j, n]);
		}
		return result;
	}

	/** 判斷自身是否被另外一個 {@link Junction} 所涵蓋 */
	private _isCoveredBy(o: Junction, n: TreeNode): boolean {
		// 方向不一樣的話肯定不是覆蓋
		if(this.$direction % 2 != o.$direction % 2) return false;

		// 基底矩形檢查
		let [r1, r2] = [o._getBaseRectangle(n), this._getBaseRectangle(n)];
		if(!r1 || !r2 || !r1.$contains(r2)) return false;

		if(r1.eq(r2)) {
			// 如果兩者完全一樣大，則比較近的覆蓋比較遠的
			return Math.abs(o.sx) < Math.abs(this.sx) || Math.abs(o.sy) < Math.abs(this.sy);
		}
		return true; // 否則大的覆蓋小的
	}

	@orderedArray("jcb") public get $coveredBy(): Junction[] {
		this.$disposeEvent();
		if(!this.$isValid) return [];
		let result: Junction[] = [];
		for(let [j, n] of this._coverCandidate) {
			if(this._isCoveredBy(j, n)) result.push(j);
		}
		return result;
	}

	@shrewd public get $isCovered(): boolean {
		this.$disposeEvent();
		return this.$coveredBy.some(j => j.$coveredBy.length == 0);
	}

	public toJSON(): JJunction {
		return {
			c: [
				{ type: CornerType.$flap, e: this.f1.node.id, q: this.q1!.q },
				{ type: CornerType.$side },
				{ type: CornerType.$flap, e: this.f2.node.id, q: this.q2!.q },
				{ type: CornerType.$side },
			],
			ox: this.ox,
			oy: this.oy,
			sx: this.sx < 0 ? -this.sx : this.sx,
		};
	}

	@shrewd public get $neighbors(): Junction[] {
		this.$disposeEvent();
		if(!isQuadrant(this.$direction)) return [];
		let a1 = this.q1!.$activeJunctions.concat();
		let a2 = this.q2!.$activeJunctions.concat();
		a1.splice(a1.indexOf(this), 1);
		a2.splice(a2.indexOf(this), 1);
		return a1.concat(a2);
	}

	@shrewdStatic public get q1(): Quadrant | null {
		let d = this.$direction;
		return isQuadrant(d) ? this.f1.$quadrants[d] : null;
	}

	@shrewdStatic public get q2(): Quadrant | null {
		let d = this.$direction;
		return isQuadrant(d) ? this.f2.$quadrants[opposite(d)] : null;
	}

	@shrewd public get $treeDistance(): number {
		this.$disposeEvent();
		let n1 = this.f1.node, n2 = this.f2.node;
		return n1.$tree.$dist(n1, n2);
	}

	@shrewd public get $status(): JunctionStatus {
		if(this._flapDistance < this.$treeDistance) return JunctionStatus.tooClose;
		else if(this.ox && this.oy) return JunctionStatus.overlap;
		else return JunctionStatus.tooFar;
	}

	/** 「f」在這邊是代表乘法係數。 */
	@shrewdStatic public get fx(): Sign {
		return -Math.sign(this.sx) as Sign;
	}

	/** 「f」在這邊是代表乘法係數。 */
	@shrewdStatic public get fy(): Sign {
		return -Math.sign(this.sy) as Sign;
	}

	/** 「o」是代表重疊區域。 */
	@shrewdStatic public get ox(): number {
		let x = this.$treeDistance - Math.abs(this.sx);
		return x > 0 ? x : NaN;
	}

	/** 「o」是代表重疊區域。 */
	@shrewdStatic public get oy(): number {
		let y = this.$treeDistance - Math.abs(this.sy);
		return y > 0 ? y : NaN;
	}

	/** 「s」是代表角片尖端構成的方框。這個值可能是負值，視 f1 f2 相對位置而定。 */
	@shrewdStatic public get sx(): number {
		let x1 = this.f1.$location.x, x2 = this.f2.$location.x;
		let w1 = this.f1.width, w2 = this.f2.width;
		let sx = x1 - x2 - w2;
		if(sx >= 0) return sx;
		sx = x1 + w1 - x2;
		if(sx <= 0) return sx;
		return NaN;
	}

	/** 「s」是代表角片尖端構成的方框。這個值可能是負值，視 f1 f2 相對位置而定。 */
	@shrewdStatic public get sy(): number {
		let y1 = this.f1.$location.y, y2 = this.f2.$location.y;
		let h1 = this.f1.height, h2 = this.f2.height;
		let sy = y1 - y2 - h2;
		if(sy >= 0) return sy;
		sy = y1 + h1 - y2;
		if(sy <= 0) return sy;
		return NaN;
	}

	@shrewdStatic private get _signX(): Sign { return Math.sign(this.sx) as Sign; }
	@shrewdStatic private get _signY(): Sign { return Math.sign(this.sy) as Sign; }
	@shrewdStatic public get $direction(): Direction {
		let x = this._signX, y = this._signY;
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

	@shrewdStatic private get _flapDistance(): number {
		let x = this.sx, y = this.sy;
		let vx = x != 0 && !isNaN(x), vy = y != 0 && !isNaN(y);
		if(vx && vy) return Math.sqrt(x * x + y * y);
		if(vx) return Math.abs(x);
		if(vy) return Math.abs(y);
		return 0;
	}

	/** 目前 isValid 的定義就是 `status == JunctionStatus.overlap` */
	@shrewdStatic public get $isValid(): boolean {
		return this.$status == JunctionStatus.overlap;
	}

	/**
	 * 找出給定的 {@link Junction} 陣列裡面 ox 或 oy 最大或最小的
	 * @param f 傳入 1 表示要找最大、-1 表示要找最小
	 */
	public static $findMinMax(
		junctions: readonly Junction[], key: JunctionDimension, f: number
	): Junction {
		if(!junctions[0]) debugger;
		let value = junctions[0][key];
		let result: Junction = junctions[0];
		for(let j = 1; j < junctions.length; j++) {
			if(junctions[j][key] * f > value * f) {
				result = junctions[j];
				value = junctions[j][key];
			}
		}
		return result;
	}
}
