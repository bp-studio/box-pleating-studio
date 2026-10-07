import { State } from "core/service/state";
import { getRidges } from "./checks";

import type { Issue } from "./checks";
import type { Path } from "shared/types/geometry";

const PALETTE = [
	"#1f6fd1", "#e07b00", "#2e9d4b", "#8e44ad", "#c2185b", "#00897b",
];
const RIDGE = "#d23c3c";
const SIDE_DIAGONAL = "#8e44ad";
const FLAP = "#1f6fd1";
const ISSUE = "#d23c3c";
const SIZE = 560;
const MARGIN = 2;
const TITLE_HEIGHT = 28;
const GAP = 16;
const CROSS_SIZE = 5;
const LABEL_OFFSET = 6;
const ARROW_SIZE = 7;
/** The angle between the wings of the arrows and the line. */
const ARROW_ANGLE = 2.6; // About 150 degrees

/** The region to draw. */
export interface Box {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

/** A panel of a picture, drawing a region of the layout. */
export class Panel {
	public readonly width: number;
	public readonly height: number;
	public readonly body: string[] = [];
	private readonly _box: Box;
	private readonly _scale: number;

	constructor(title: string, box: Box = boundingBox()) {
		this._box = box;
		this._scale = SIZE / Math.max(box.x2 - box.x1, box.y2 - box.y1);
		this.width = (box.x2 - box.x1) * this._scale;
		this.height = (box.y2 - box.y1) * this._scale + TITLE_HEIGHT;
		this.body.push(
			`<rect width="${this.width}" height="${this.height}" fill="#fff"/>`,
			`<text x="${this.width / 2}" y="19" font-size="14" ` +
			`font-weight="bold" text-anchor="middle">${escape(title)}</text>`
		);
		this._drawGrid();
	}

	public x(x: number): number {
		return (x - this._box.x1) * this._scale;
	}

	public y(y: number): number {
		return TITLE_HEIGHT + (this._box.y2 - y) * this._scale;
	}

	public points(path: readonly IPoint[]): string {
		return path.map(p => `${this.x(p.x)},${this.y(p.y)}`).join(" ");
	}

	public line(p: IPoint, q: IPoint, attributes: string): void {
		const [x1, y1] = [this.x(p.x), this.y(p.y)];
		const [x2, y2] = [this.x(q.x), this.y(q.y)];
		this.body.push(
			`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attributes}/>`
		);
	}

	public cross(p: IPoint): void {
		const [x, y, s] = [this.x(p.x), this.y(p.y), CROSS_SIZE];
		this.body.push(
			`<path d="M${x - s},${y - s}L${x + s},${y + s}M${x - s},${y + s}` +
			`L${x + s},${y - s}" stroke="${ISSUE}" stroke-width="2"/>`
		);
	}

	private _drawGrid(): void {
		const b = this._box;
		const attributes = "stroke=\"#eee\"";
		for(let x = Math.ceil(b.x1); x <= b.x2; x++) {
			this.line({ x, y: b.y1 }, { x, y: b.y2 }, attributes);
		}
		for(let y = Math.ceil(b.y1); y <= b.y2; y++) {
			this.line({ x: b.x1, y }, { x: b.x2, y }, attributes);
		}
	}
}

/**
 * Put the panels side by side into an SVG picture. The panels must be
 * created and filled one at a time, as they draw the current layout.
 */
export function compose(panels: readonly Panel[]): string {
	let x = 0;
	const groups: string[] = [];
	for(const panel of panels) {
		// A nested SVG clips the content outside the panel.
		groups.push(
			`<svg x="${x}" y="0" width="${panel.width}" ` +
			`height="${panel.height}">\n${panel.body.join("\n")}\n</svg>`
		);
		x += panel.width + GAP;
	}
	const width = x - GAP;
	const height = Math.max(...panels.map(p => p.height));
	return `<svg xmlns="http://www.w3.org/2000/svg" ` +
		`viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" ` +
		`font-family="sans-serif">\n` +
		`<rect width="${width}" height="${height}" fill="#fff"/>\n` +
		groups.join("\n") + "\n</svg>\n";
}

/**
 * Draw the final rendering of the current layout: the final contours of all
 * nodes (each node in its own color), the ridges, the flaps, and the
 * locations of the issues.
 */
export function drawFinal(panel: Panel, issues: readonly Issue[] = []): Panel {
	forEachContour((paths, color) => {
		const d = paths.map(p => `M${panel.points(p)}Z`).join("");
		panel.body.push(
			`<path d="${d}" fill="${color}" fill-opacity="0.08" ` +
			`fill-rule="evenodd" stroke="${color}" stroke-width="1.6"/>`
		);
	});
	for(const [p, q] of getRidges()) {
		panel.line(p, q, `stroke="${RIDGE}" stroke-width="0.9"`);
	}
	drawFlaps(panel);
	for(const p of issues.flatMap(issue => issue.points)) panel.cross(p);
	return panel;
}

/**
 * Draw the internals of the contour algorithm in the current layout: the trace
 * contours (dashed in raw mode), the pattern contours (with arrows), and the
 * ridges and side diagonals of the repos used in the tracing.
 */
export function drawTrace(panel: Panel): Panel {
	for(const stretch of State.$stretches.values()) {
		const repo = stretch.$repo;
		for(const device of repo.$pattern?.$devices ?? []) {
			for(const r of device.$traceRidges) {
				panel.line(r.p1, r.p2, `stroke="${RIDGE}" stroke-width="0.8" ` +
					"stroke-opacity=\"0.6\"");
			}
		}
		for(const d of repo.$configuration?.$sideDiagonals ?? []) {
			panel.line(d.p1, d.p2, `stroke="${SIDE_DIAGONAL}" stroke-width="1.2"`);
		}
	}
	State.m.$tree.$nodes.forEach((node, i) => {
		if(!node?.$parent) return;
		const color = PALETTE[i % PALETTE.length];
		for(const trace of node.$graphics.$traceContours) {
			const dash = trace.$raw ? " stroke-dasharray=\"4,2\"" : "";
			for(const path of trace.$outer) {
				panel.body.push(`<polygon points="${panel.points(path)}" ` +
					`fill="none" stroke="${color}" stroke-width="1.2"${dash}/>`);
			}
		}
		for(const contour of node.$graphics.$patternContours) {
			drawArrow(panel, contour, color);
		}
	});
	drawFlaps(panel);
	return panel;
}

/** Draw the current layout with the issues as a single picture. */
export function drawLayout(title: string, issues: readonly Issue[]): string {
	return compose([drawFinal(new Panel(title), issues)]);
}

function forEachContour(action: (paths: Path[], color: string) => void): void {
	State.m.$tree.$nodes.forEach((node, i) => {
		if(!node?.$parent) return;
		const color = PALETTE[i % PALETTE.length];
		for(const contour of node.$graphics.$contours) {
			action([contour.outer, ...contour.inner ?? []], color);
		}
	});
}

function drawArrow(panel: Panel, path: readonly IPoint[], color: string): void {
	panel.body.push(`<polyline points="${panel.points(path)}" fill="none" ` +
		`stroke="${color}" stroke-width="3"/>`);
	if(path.length < 2) return;
	const p = path[path.length - 1], q = path[path.length - 2];
	const [x, y] = [panel.x(p.x), panel.y(p.y)];
	const angle = Math.atan2(y - panel.y(q.y), x - panel.x(q.x));
	const wing = (sign: number): string => {
		const a = angle + sign * ARROW_ANGLE;
		return `${x + ARROW_SIZE * Math.cos(a)},${y + ARROW_SIZE * Math.sin(a)}`;
	};
	panel.body.push(
		`<polygon points="${x},${y} ${wing(1)} ${wing(-1)}" fill="${color}"/>`
	);
}

function drawFlaps(panel: Panel): void {
	for(const node of State.m.$tree.$nodes) {
		if(!node?.$isLeaf) continue;
		const [t, r, b, l] = node.$AABB.$toValues();
		const x = panel.x((l + r) / 2), y = panel.y((t + b) / 2);
		panel.body.push(
			`<circle cx="${x}" cy="${y}" r="3" fill="${FLAP}"/>`,
			`<text x="${x}" y="${y - LABEL_OFFSET}" font-size="11" ` +
			`font-weight="bold" fill="${FLAP}" text-anchor="middle">` +
			`f${node.id}</text>`
		);
	}
}

function boundingBox(): Box {
	const points = State.m.$tree.$nodes.flatMap(node =>
		node?.$graphics.$roughContours.flatMap(c => c.$outer.flat()) ?? []
	);
	const xs = points.map(p => p.x), ys = points.map(p => p.y);
	return {
		x1: Math.min(...xs) - MARGIN, y1: Math.min(...ys) - MARGIN,
		x2: Math.max(...xs) + MARGIN, y2: Math.max(...ys) + MARGIN,
	};
}

function escape(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}
