
type Path = Point[];
type ReadonlyPath = readonly Point[];

namespace PathUtil {

	/** 傳入一個三角形，讓第一個點固定不動，移動第二個點到指定的目標但是維持三角形相似；傳回第三點 */
	export function $triangleTransform(triangle: Path, to: Point): Point {
		let [p1, p2, p3] = triangle;
		let [v1, v2, v3] = [to, p2, p3].map(p => p.sub(p1));
		let m = Matrix.$getTransformMatrix(v2, v1);
		return p1.add(m.$multiply(v3));
	}

	/** 把內部路徑中有共用頂點的合併成單一的路徑，並且同時建立頂點索引 */
	export function $collect(paths: Path[]) {
		let result: Path[] = [], map = new Map<string, [number, number]>(), i = 0;
		for(let path of paths) {
			let merged = false;
			for(let [j, p] of path.entries()) {
				let s = p.toString(), k = map.get(s);
				if(k) {
					if(!result[k[0]]) continue; // 這個情況表示路徑內部就有重複的點，略過不看
					result[k[0]].splice(k[1], 0, ...$rotate(path, j));
					for(let [i, p] of result[k[0]].entries()) map.set(p.toString(), [k[0], i]);
					merged = true;
					break;
				} else map.set(s, [i, j]);
			}
			if(!merged) { result.push(path); i++; }
		}
		return { paths: result, map };
	}

	/**
	 * 把路徑 p1 和 p2 合併之後傳回新的路徑。
	 *
	 * 這個演算法假定了兩個路徑的時鐘方向相同，而且恰共用一條邊。
	 */
	export function $join(p1: Path, p2: Path) {
		p1 = p1.concat(); p2 = p2.concat();
		for(let i = 0; i < p1.length; i++) {
			for(let j = 0; j < p2.length; j++) {
				if(p1[i].eq(p2[j])) {
					$rotate(p2, j);
					p1.splice(i, 2, ...p2);
					return p1;
				}
			}
		}
		return p1;
	}

	export function $shift(path: Path, v: Vector): Path {
		return path.map(p => p.add(v));
	}

	/**
	 * 判斷兩個路徑所描述的多邊形是否有重疊。
	 *
	 * 注意這邊我們只檢查各頂點是否有落在對方區域中，
	 * 因此這個演算法並未考慮兩個多邊形互相穿刺的情形，但是應該暫且堪用。
	 */
	export function $polygonIntersect(p1: Path, p2: Path): boolean {
		return p1.some(p => $pointInPolygon(p, p2)) || p2.some(p => $pointInPolygon(p, p1));
	}

	export function $lineInsidePath(l: Line, path: Path) {
		return $pointInPolygon(l.p1, path, true) && $pointInPolygon(l.p2, path, true);
	}

	export function $pointInsidePath(p: Point, path: Path) {
		return $pointInPolygon(p, path);
	}

	/**
	 * 判斷一個點是否完全落在一個多邊形裡面（預設是不計邊緣）
	 *
	 * 參考 W. Randolph Franklin 的 PNPOLY 演算法寫成：
	 * https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
	 */
	function $pointInPolygon(p: Point, path: Path, boundary = false): boolean {
		// 退化的情況
		if(path.length == 2) return boundary && new Line(path[0], path[1]).$contains(p, true);

		// 先進行數值化以加速演算；產生的誤差在這裡的應用上不會是個問題
		let dx: number[] = [], dy: number[] = [];
		for(let v of path) {
			dx.push(v._x.sub(p._x).$value);
			dy.push(v._y.sub(p._y).$value);
		}

		// PNPOLY 演算法的主體，基本上就是射線演算法的高速實作
		let n = false;
		for(let i = 0, j = path.length - 1; i < path.length; j = i++) {
			let [xi, yi] = [dx[i], dy[i]];
			let [xj, yj] = [dx[j], dy[j]];
			let mx = xi >= 0, nx = xj >= 0;
			let my = yi >= 0, ny = yj >= 0;
			if(!((my || ny) && (mx || nx)) || (mx && nx)) continue;
			if(!(my && ny && (mx || nx) && !(mx && nx))) {
				let test = (yi * xj - xi * yj) / (xj - xi);
				if(test < 0) continue;
				if(test == 0) return boundary;
			}
			n = !n;
		}
		return n;
	}

	/** 把一個路徑的前面 j 個點移到後面去，並且傳回路徑自身 */
	function $rotate(p: Path, j: number) {
		p.push(...p.splice(0, j));
		return p;
	}

	export function $toSegments(path: Path): PolyBool.Segments {
		return PolyBool.segments({ regions: [path.map(p => [p.x, p.y])], inverted: false });
	}
}
