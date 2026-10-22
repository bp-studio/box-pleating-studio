
/**
 * Canonical serialization of geometric data, independent of the order of
 * computation. Used for comparing graphics in `consistency.ts`.
 */

/**
 * Serializes geometric data. Points are reduced to their numeric coordinates
 * (instead of the internal fraction representation), and extra properties on
 * arrays (such as {@link PathEx.isHole}) are kept.
 */
export function serialize(value: unknown): string {
	return JSON.stringify(normalize(value));
}

function normalize(value: unknown): unknown {
	if(value === null || typeof value !== "object") return value;
	if(Array.isArray(value)) {
		const items = rotatePolygon(value.map(normalize));
		const record = value as unknown as Record<string, unknown>;
		const extra = Object.keys(record).filter(k => !/^\d+$/.test(k));
		if(!extra.length) return items;
		const result: Record<string, unknown> = { items };
		for(const k of extra) result[k] = normalize(record[k]);
		return result;
	}
	const v = value as Record<string, unknown>;
	if(typeof v.x === "number" && typeof v.y === "number") {
		return { x: v.x, y: v.y };
	}
	const result: Record<string, unknown> = {};
	for(const k of Object.keys(v).sort()) {
		if(k.startsWith("$") || typeof v[k] === "function") continue;
		result[k] = normalize(v[k]);
	}
	return result;
}

/**
 * A list of three or more points is a polygon, which is rotated so that it
 * starts from the lexicographically smallest vertex (keeping the orientation),
 * since the starting vertex depends on the order of computation.
 */
function rotatePolygon(items: unknown[]): unknown[] {
	if(items.length < 3 || !items.every(isPoint)) return items;
	const points = items as IPoint[];
	let start = 0;
	for(const [i, p] of points.entries()) {
		const s = points[start];
		if(p.x < s.x || p.x === s.x && p.y < s.y) start = i;
	}
	return points.slice(start).concat(points.slice(0, start));
}

function isPoint(item: unknown): boolean {
	if(item === null || typeof item !== "object") return false;
	const keys = Object.keys(item);
	return keys.length === 2 && keys[0] === "x" && keys[1] === "y";
}

export function sortBySerialization(items: readonly unknown[]): unknown[] {
	return items
		.map(item => [serialize(item), item] as const)
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([, item]) => item);
}

export function sortLines(
	lines: readonly (readonly [IPoint, IPoint])[]
): unknown[] {
	const key = (p: IPoint): string => p.x + "," + p.y;
	return sortBySerialization(lines.map(([p, q]) =>
		key(p) <= key(q) ? [p, q] : [q, p]
	));
}
