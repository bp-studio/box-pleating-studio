
type Path = Point[];
type ReadonlyPath = readonly Point[];

namespace PathUtil {

	/** 傳入一個三角形，讓第一個點固定不動，移動第二個點到指定的目標但是維持三角形相似；傳回第三點 */
	export function triangleTransform(triangle: Path, to: Point): Point {
		let [p1, p2, p3] = triangle;
		let [v1, v2, v3] = [to, p2, p3].map(p => p.sub(p1));
		let m = Matrix.getTransformMatrix(v2, v1);
		return p1.add(m.multiply(v3));
	}

	/** 把內部路徑中有共用頂點的合併成單一的路徑，並且同時建立頂點索引 */
	export function collect(paths: Path[]) {
		let result: Path[] = [], map = new Map<string, [number, number]>(), i = 0;
		for(let path of paths) {
			let merged = false;
			for(let [j, p] of path.entries()) {
				let s = p.toString(), k = map.get(s);
				if(k) {
					if(!result[k[0]]) continue; // 這個情況表示路徑內部就有重複的點，略過不看
					result[k[0]].splice(k[1], 0, ...rotate(path, j));
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
	export function join(p1: Path, p2: Path) {
		p1 = p1.concat(); p2 = p2.concat();
		for(let i = 0; i < p1.length; i++) {
			for(let j = 0; j < p2.length; j++) {
				if(p1[i].eq(p2[j])) {
					rotate(p2, j);
					p1.splice(i, 2, ...p2);
					return p1;
				}
			}
		}
		return p1;
	}

	export function shift(path: Path, v: Vector): Path {
		return path.map(p => p.add(v));
	}

	/**
	 * 判斷兩個路徑所描述的多邊形是否有重疊。
	 *
	 * 注意這邊我們只檢查各頂點是否有落在對方區域中，
	 * 因此這個演算法並未考慮兩個多邊形互相穿刺的情形，但是應該暫且堪用。
	 */
	export function polygonIntersect(p1: Path, p2: Path): boolean {
		let l1 = pathToLines(p1), l2 = pathToLines(p2);
		return p1.some(p => pointInPolygon(p, l2)) || p2.some(p => pointInPolygon(p, l1));
	}

	export function lineInsidePath(l: Line, path: Path) {
		let lines = pathToLines(path);
		return pointInPolygon(l.p1, lines, true) && pointInPolygon(l.p2, lines, true);
	}

	export function pointInsidePath(p: Point, path: Path) {
		return pointInPolygon(p, pathToLines(path));
	}

	function pathToLines(p: Path): Line[] {
		let result: Line[] = [];
		for(let i = 0; i < p.length; i++) {
			let [p1, p2] = [p[i], p[(i + 1) % p.length]];
			if(!p1.eq(p2)) result.push(new Line(p1, p2));
		}
		return result;
	}

	/** 實作射線演算法來判斷一個點是否完全落在一個多邊形裡面（預設是不計邊緣） */
	function pointInPolygon(p: Point, lines: Line[], boundary = false): boolean {
		// 退化的情況
		if(lines.length <= 2) return boundary && lines[0].contains(p, true);

		let n = 0, v = new Vector(1, 0);
		for(let l of lines) {
			if(l.p1.eq(p) || l.p2.eq(p)) return boundary;
			let int = l.intersection(p, v, true);
			if(!int) continue;
			if(int.eq(p)) return boundary;
			let e1 = int.eq(l.p1), e2 = int.eq(l.p2);
			if(!e1 && !e2 || e1 && l.p2._y.lt(p._y) || e2 && l.p1._y.lt(p._y)) n++;
		}
		return n % 2 == 1;
	}

	/** 把一個路徑的前面 j 個點移到後面去，並且傳回路徑自身 */
	function rotate(p: Path, j: number) {
		p.push(...p.splice(0, j));
		return p;
	}
}
