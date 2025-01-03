/* istanbul ignore file: difficult to cover */

// We put these functions here to manage module dependencies.

type ConstrainFunc = Func<IPoint, IPoint>;

export function constrainVertex(constrain: ConstrainFunc, location: IPoint, v: IPoint): IPoint {
	return fixVector(constrain, location, v);
}

export function constrainFlap(constrain: ConstrainFunc, location: IPoint, w: number, h: number, v: IPoint): IPoint {
	const zeroWidth = w === 0;
	const zeroHeight = h === 0;
	const { x, y } = location;
	if(zeroWidth && zeroHeight) {
		return fixVector(constrain, location, v);
	} else if(zeroWidth || zeroHeight) {
		v = fixVector(constrain, location, v);
		const p = zeroWidth ? { x, y: y + h } : { x: x + w, y };
		return fixVector(constrain, p, v);
	} else {
		// We allow at most one tip to go beyond the range of the sheet.
		const data = getDots(location, w, h)
			.map(p => {
				const fix = fixVector(constrain, p, v);
				const dx = fix.x - v.x;
				const dy = fix.y - v.y;
				const d = dx * dx + dy * dy;
				return { p, d, fix };
			})
			.filter(e => e.d > 0)
			.sort((a, b) => b.d - a.d);
		if(data.length <= 1) return v;
		let result = data[1].fix;
		if(data[2]) result = fixVector(constrain, data[2].p, result);
		if(data[3]) result = fixVector(constrain, data[3].p, result);
		return result;
	}
}

function fixVector(constrain: ConstrainFunc, pt: IPoint, v: IPoint): IPoint {
	const target = { x: pt.x + v.x, y: pt.y + v.y };
	const fix = constrain(target);
	return { x: fix.x - pt.x, y: fix.y - pt.y };
}

/** Flap tip positions, ordered by quadrants. */
export function getDots(location: IPoint, w: number, h: number): IPoint[] {
	const { x, y } = location;
	return [
		{ x: x + w, y: y + h },
		{ x, y: y + h },
		location,
		{ x: x + w, y },
	];
}

export function rectangularConstrain(w: number, h: number, p: IPoint): IPoint {
	let { x, y } = p;
	if(x < 0) x = 0;
	if(x > w) x = w;
	if(y < 0) y = 0;
	if(y > h) y = h;
	return { x, y };
}

export function diagonalConstrain(w: number, _: number, p: IPoint): IPoint {
	let { x, y } = p;
	const s = w, h = s % 2;
	const f = (s - h) / 2;
	const c = (s + h) / 2;

	if(x + y < f) {
		const d = f - x - y;
		x += Math.floor(d / 2);
		y += Math.ceil(d / 2);
	}

	if(y - x > c) {
		const d = y - x - c;
		x += Math.floor(d / 2);
		y -= Math.ceil(d / 2);
	}

	if(x - y > c) {
		const d = x - y - c;
		x -= Math.floor(d / 2);
		y += Math.ceil(d / 2);
	}

	if(x + y > c + s) {
		const d = x + y - c - s;
		x -= Math.floor(d / 2);
		y -= Math.ceil(d / 2);
	}

	if(x < 0) x = 0;
	if(x > s) x = s;

	return { x, y };
}

