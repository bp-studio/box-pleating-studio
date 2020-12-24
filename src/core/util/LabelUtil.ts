
interface labelCache {
	dx: number;
	dy: number;
	timeout?: number;
}

//////////////////////////////////////////////////////////////////
/**
 * 繪製元件的文字標籤的工具類別。
 */
//////////////////////////////////////////////////////////////////

namespace LabelUtil {

	let cache: WeakMap<paper.PointText, labelCache> = new WeakMap();

	function offsetLabel(label: paper.PointText, lx: number, ly: number, lh: number, dx: number, dy: number) {
		label.justification = dx == 0 ? "center" : dx == 1 ? "left" : "right";
		let oy = dy == 0 ? -lh / 5 : dy == -1 ? -lh / 2 : 0;
		let l = Math.sqrt(dx * dx + dy * dy);
		let d = l == 0 ? 0 : lh / 2 / l;
		label.point.set(lx + dx * d, ly - dy * d - oy);
	}

	export function setLabel(sheet: Sheet, label: paper.PointText, glow: paper.PointText, pt: IPoint, ...avoid: paper.Path[]) {

		glow.content = label.content;
		if(!label.content) return;

		let x = pt.x, y = pt.y;
		let ss = sheet.displayScale, sw = sheet.width, sh = sheet.height;
		let lh = label.bounds.height;
		let lx = x * ss, ly = -y * ss;

		if(x == 0 || y == 0 || x == sw || y == sh) {
			// 如果要求的位置在邊界上，直接處理
			let dx = x == 0 ? -1 : x == sw ? 1 : 0;
			let dy = y == 0 ? -1 : y == sh ? 1 : 0;
			offsetLabel(label, lx, ly, lh, dx, dy);
		} else {
			// 由於程式碼效能的增加，底下這段程式碼似乎暫時用不到，不過先予以保留以防未來需要。
			/* if(LabelUtil.cache.has(label)) {
				let { dx, dy, timeout } = LabelUtil.cache.get(label)!;
				// 先用之前暫存的 dx dy
				LabelUtil.offsetLabel(label, lx, ly, lh, dx, dy);
				// 設置 timeout
				clearTimeout(timeout);
				timeout = setTimeout(() => {
					LabelUtil.slowLabel(label, lx, ly, lh, avoid);
					LabelUtil.syncLabel(label, glow);
				}, 10);
				LabelUtil.cache.set(label, { dx, dy, timeout });
			} else {
				// 初次直接執行
				LabelUtil.slowLabel(label, lx, ly, lh, avoid);
			} */

			slowLabel(label, lx, ly, lh, avoid);
		}
		syncLabel(label, glow);
	}

	function syncLabel(label: paper.PointText, glow: paper.PointText) {
		glow.point.set(label.point);
		glow.justification = label.justification;
	}

	/**
	 * 原本把這部份的程式碼拉出來是為了要做 debouncing，
	 * 不過由於程式碼效能的提昇暫時似乎不用這麼做。
	 */
	function slowLabel(label: paper.PointText, lx: number, ly: number, lh: number, avoid: paper.Path[]) {
		let arr = [[0, 0], [0, -1], [-1, 0], [0, 1], [1, 0], [-1, -1], [-1, 1], [1, 1], [1, -1]];
		let clone = avoid.map(a => {
			let c = a.clone({ insert: false });
			if(a.layer) c.transform(a.layer.matrix);
			return c;
		});
		let dx = 0, dy: number = 0;
		for([dx, dy] of arr) {
			offsetLabel(label, lx, ly, lh, dx, dy);

			let rec = new paper.Path.Rectangle(label.bounds);
			if(label.layer) rec.transform(label.layer.matrix);

			let ok = clone.every(c => {
				let i1 = rec.intersect(c, { insert: false }).isEmpty();
				let i2 = !rec.intersects(c);
				return i1 && i2;
			})
			if(ok) break;
		}
		cache.set(label, {
			dx, dy, timeout: undefined
		});
	}
}
