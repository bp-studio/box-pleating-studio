import { AAUnion, GeneralUnion } from "../../src/core/math/sweepLine/polyBool";

import type { Polygon } from "shared/types/geometry";

const factor = 4;
const full = 150 * factor;

const toast = document.getElementById("toast") as HTMLDivElement;
const cInput = document.getElementById("cInput") as HTMLCanvasElement;
const cOutput = document.getElementById("cOutput") as HTMLCanvasElement;
const btn = document.getElementById("btn") as HTMLButtonElement;
const btn2 = document.getElementById("btn2") as HTMLButtonElement;

btn.onclick = run;
btn2.onclick = run2;

cInput.onmousemove = e => toast.innerText = `${Math.round(e.offsetX / factor)}, ${Math.round((full - e.offsetY) / factor)}`;
cOutput.onmousemove = e => toast.innerText = `${Math.round(e.offsetX / factor)}, ${Math.round((full - e.offsetY) / factor)}`;
cInput.width = full;
cInput.height = full;
cOutput.width = full;
cOutput.height = full;

const ctxInput = cInput.getContext("2d")!;
const ctxOutput = cOutput.getContext("2d")!;

function draw(ctx: CanvasRenderingContext2D, ...polygons: Polygon[]): void {
	ctx.clearRect(0, 0, full, full);
	for(const polygon of polygons) {
		for(const path of polygon) {
			ctx.beginPath();
			const last = path[path.length - 1];
			ctx.moveTo(last.x * factor + 0.5, full - last.y * factor + 0.5);
			for(const p of path) ctx.lineTo(p.x * factor + 0.5, full - p.y * factor + 0.5);
			ctx.closePath();
			ctx.stroke();
		}
	}
}

function run(): void {
	const textArea = document.getElementById("T") as HTMLTextAreaElement;
	const data = JSON.parse(textArea.value) as Polygon[];
	draw(ctxInput, ...data);
	const result = new AAUnion().$get(...data);
	draw(ctxOutput, result);
}

function run2(): void {
	const textArea = document.getElementById("T") as HTMLTextAreaElement;
	const data = JSON.parse(textArea.value) as Polygon[];
	draw(ctxInput, ...data);
	const result = new GeneralUnion().$get(...data);
	draw(ctxOutput, result);
}
