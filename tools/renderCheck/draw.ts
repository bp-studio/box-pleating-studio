import { State } from "core/service/state";
import { LayoutController } from "core/controller/layoutController";
import { build, isCheckable } from "./layouts";
import { checkRendering } from "./checks";
import { Panel, compose, drawFinal, drawTrace } from "./svg";

import type { Box } from "./svg";
import type { Issue } from "./checks";
import type { Layout } from "./layouts";

/** A device move, given as `stretch:device:dx:dy`. */
interface Move {
	stretch: string;
	device: number;
	dx: number;
	dy: number;
}

interface Case {
	layout: Layout;
	label: string;
	moves: Move[];
}

/**
 * Draw the given cases side by side, separated by `;`. Each case is given as
 * `edges|flaps|label|moves`, where the first two are the arguments of
 * `parseTree()`, and the last two are optional. The moves are separated by
 * `/`, each given as `stretch:device:dx:dy` (the stretch being the ids of its
 * flaps joined by `,`, as in the Core).
 *
 * @param trace Whether to draw the internals of the contour algorithm as well.
 * @param box The region to draw. Defaults to that of each case.
 * @returns The SVG picture and the issues of each case.
 */
export function drawCases(
	spec: string, trace: boolean, box?: Box
): [svg: string, summary: string[]] {
	const panels: Panel[] = [];
	const summary: string[] = [];
	for(const { layout, label, moves } of parseCases(spec)) {
		build(layout);
		for(const move of moves) applyMove(move);
		const issues: Issue[] = isCheckable() ? checkRendering() : [];
		const status = isCheckable() ?
			issues.map(issue => issue.message).join("; ") || "no issues" :
			"not checkable";
		const title = label ? `${label}: ${status}` : status;
		summary.push(title);
		panels.push(drawFinal(new Panel(title, box), issues));
		if(trace) panels.push(drawTrace(new Panel(`${label} (trace)`, box)));
	}
	return [compose(panels), summary];
}

function applyMove({ stretch, device, dx, dy }: Move): void {
	const pattern = State.$stretches.get(stretch)?.$repo.$pattern;
	const target = pattern?.$devices[device];
	if(!target) throw new Error(`Device ${device} of ${stretch} not found`);
	const { x, y } = target.$location;
	LayoutController.moveDevice(stretch, device, { x: x + dx, y: y + dy });
}

/** Parse a region given as `x1,y1,x2,y2`. */
export function parseBox(spec: string): Box {
	const [x1, y1, x2, y2] = spec.split(",").map(Number);
	return { x1, y1, x2, y2 };
}

function parseCases(spec: string): Case[] {
	return spec.split(";").map(item => {
		const [edges, flaps, label = "", moves = ""] = item.split("|");
		return {
			layout: parseLayout(edges, flaps),
			label,
			moves: moves ? moves.split("/").map(parseMove) : [],
		};
	});
}

function parseMove(spec: string): Move {
	const match = /^(.+):(\d+):(-?\d+):(-?\d+)$/.exec(spec);
	if(!match) throw new Error(`Invalid move: ${spec}`);
	const [, stretch, device, dx, dy] = match;
	return { stretch, device: Number(device), dx: Number(dx), dy: Number(dy) };
}

/** Parse the arguments of `parseTree()` into a layout. */
export function parseLayout(edges: string, flaps: string): Layout {
	const tuples = (s: string): number[][] =>
		[...s.matchAll(/\(([^)]*)\)/g)].map(m => m[1].split(",").map(Number));
	return {
		edges: tuples(edges).map(([n1, n2, length]) => ({ n1, n2, length })),
		flaps: tuples(flaps).map(
			([id, x, y, width, height]) => ({ id, x, y, width, height })
		),
	};
}
