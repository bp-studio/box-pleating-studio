import ProjectService from "client/services/projectService";
import { style } from "client/services/styleService";
import { MARGIN } from "client/shared/constant";
import { SvgGraphics } from "./svgGraphics";
import { drawContours, drawLines, fillContours } from "client/utils/contourUtil";
import { SelectionController } from "client/controllers/selectionController";
import { toHex } from "shared/utils/color";
import settings from "app/services/settingService";

import type { LabelView } from "client/utils/label";
import type { Project } from "client/project/project";
import type { Design } from "client/project/design";
import type { Sheet } from "client/project/components/sheet";
import type { Path } from "shared/types/geometry";
import type { Flap } from "client/project/components/layout/flap";
import type { River } from "client/project/components/layout/river";

let includeHiddenElement: boolean;

//=================================================================
/**
 * Creates SVG for the given {@link Project}.
 *
 * We don't use any fancy SVG library here and instead operate
 * on strings directly to save the overhead.
 */
//=================================================================
export function svg(proj: Project, includeHidden: boolean): Blob {
	includeHiddenElement = includeHidden;
	const design = proj.design;
	const sheet = design.sheet;
	const { width, height } = sheet.$imageDimension.value;
	const clipPath = toSVGPath(sheet.grid.$getBorderPath());
	const content = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
		`width="${width}" height="${height}" viewBox="0,0,${width},${height}">` + getStyle() + getClip(clipPath) +
		`<g transform="${getTransform(sheet, height)}">` +
		getBorderLayer(sheet, clipPath) +
		getShadeLayer(design) +
		getEdgeLayer(design) +
		getHingeLayer(design) +
		getRidgeLayer(design) +
		getAxisParallelLayer(design) +
		getJunctionLayer(design) +
		getDotLayer(design) +
		getVertexLayer(design) +
		getLabelLayer(design) +
		`</g></svg>`;
	return new Blob([content], { type: "image/svg+xml" });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Headers
/////////////////////////////////////////////////////////////////////////////////////////////////////

/** Generate the CSS rules. */
function getStyle(): string {
	const { border, hinge, ridge, junction, grid, shade, label, edge, vertex, dot, axisParallel } = style;
	const s = ProjectService.scale.value;
	const fontSize = label.size * Math.sqrt(ProjectService.shrink.value) / s;
	const text = `dominant-baseline:middle;text-anchor:middle;font-size:${fontSize}px;font-family:Arial`;
	const result =
		`.hidden{opacity:0;}` +
		`.border{${lineStyle(border.color, border.width)}}` +
		`.edge{${lineStyle(edge.color, edge.width)}}` +
		`.edge.selected{${lineStyle(edge.selected, edge.hover)}}` +
		`.grid{${lineStyle(grid.color, grid.width)}}` +
		`.hinge{${lineStyle(hinge.color, hinge.width)}}` +
		`.ridge{${lineStyle(ridge.color, ridge.width)}}` +
		`.axis-parallel{${lineStyle(axisParallel.color, axisParallel.width)}}` +
		`.circle{${lineStyle(hinge.color, 1)}}` +
		`.vertex{${lineStyle(vertex.color, vertex.width, vertex.fill)}}` +
		`.vertex.selected{${lineStyle(vertex.selected, vertex.hover, vertex.fill)}}` +
		`.shade{${lineStyle(0, 0, hinge.color)};opacity:${shade.alpha};fill-rule:evenodd}` +
		`.junction{${lineStyle(junction.color, 0, junction.color)};opacity:${junction.alpha};stroke-linejoin:bevel}` +
		`.label{${lineStyle(label.color, label.weight, label.color)};${text}}` +
		`.label.edge{fill:${toHex(edge.selected)}}` +
		`.label.vertex{fill:${toHex(vertex.selected)}}` +
		`.dot{${lineStyle(dot.color, dot.width, dot.fill)}}` +
		`.glow{${lineStyle(label.border, label.glow, label.border)};${text}}`;
	return `<style>${result}</style>`;
}

/** Generate the border clipping. */
function getClip(clipPath: string): string {
	return `<defs><clipPath id="clip"><path d="${clipPath}" /></clipPath></defs>`;
}

/** The global transformation. */
function getTransform(sheet: Sheet, height: number): string {
	const s = ProjectService.scale.value;
	const horOffset = MARGIN;
	const verOffset = height - MARGIN;
	return `translate(${horOffset} ${verOffset}) scale(${s} ${-s})`;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Layers
/////////////////////////////////////////////////////////////////////////////////////////////////////

function getBorderLayer(sheet: Sheet, borderPath: string): string {
	let result = `<path class="border" d="${borderPath}" />`;
	if(settings.display.grid || includeHiddenElement) {
		const graphics = new SvgGraphics();
		graphics.$class = "grid" + (settings.display.grid ? "" : " hidden");
		sheet.grid.$drawGrid(graphics);
		result += graphics.$get();
	}
	return layer(result);
}

function getShadeLayer(design: Design): string {
	if(design.mode != "layout") return "";
	const graphics = new SvgGraphics();
	graphics.$class = "shade";
	for(const control of SelectionController.selections as (River | Flap)[]) {
		fillContours(graphics, control.$graphics.contours!, 0);
	}
	return layer(graphics.$get(), true);
}

function getEdgeLayer(design: Design): string {
	if(design.mode != "tree") return "";
	const graphics = new SvgGraphics();
	for(const edge of design.tree.$edges.values()) {
		graphics.$class = "edge" + (edge.$selected ? " selected" : "");
		edge.$drawLine(graphics);
		graphics.$addPath();
	}
	return layer(graphics.$get(), true);
}

function getHingeLayer(design: Design): string {
	const hidden = !settings.display.hinge;
	if(design.mode != "layout" || hidden && !includeHiddenElement) return "";
	const objects = [...design.layout.$flaps, ...design.layout.$rivers.values()];
	const graphics = new SvgGraphics();
	for(const obj of objects) {
		graphics.$class = "hinge";
		drawContours(graphics, obj.$graphics.contours);
		if(obj.type == "Flap") {
			graphics.$class = "circle";
			obj.$drawCircle(graphics);
		}
	}
	return layer(graphics.$get(), true, hidden);
}

function getRidgeLayer(design: Design): string {
	const hidden = !settings.display.ridge;
	if(design.mode != "layout" || hidden && !includeHiddenElement) return "";
	const objects = [...design.layout.$flaps, ...design.layout.$rivers.values()];
	const graphics = new SvgGraphics();
	graphics.$class = "ridge";
	for(const obj of objects) {
		drawLines(graphics, obj.$graphics.ridges);
	}
	for(const stretch of design.layout.$stretches.values()) {
		for(const device of stretch.$devices) {
			drawLines(graphics, device.$graphics.ridges);
		}
	}
	return layer(graphics.$get(), true, hidden);
}

function getAxisParallelLayer(design: Design): string {
	const hidden = !settings.display.axialParallel;
	if(design.mode != "layout" || hidden && !includeHiddenElement) return "";
	const graphics = new SvgGraphics();
	graphics.$class = "axis-parallel";
	for(const stretch of design.layout.$stretches.values()) {
		for(const device of stretch.$devices) {
			drawLines(graphics, device.$graphics.axisParallel);
		}
	}
	return layer(graphics.$get(), true, hidden);
}

function getJunctionLayer(design: Design): string {
	if(design.mode != "layout") return "";
	const s = ProjectService.scale.value;
	const graphics = new SvgGraphics();
	graphics.$class = "junction";
	for(const junction of design.layout.$junctions.values()) {
		junction.$draw(s, graphics);
	}
	return layer(graphics.$get(), true, false, `style="opacity:${style.junction.alpha}"`);
}

function getDotLayer(design: Design): string {
	const hidden = !settings.display.dot;
	if(design.mode != "layout" || hidden && !includeHiddenElement) return "";
	const graphics = new SvgGraphics();
	graphics.$class = "dot";
	for(const f of design.layout.$flaps) {
		f.$drawDot(graphics);
	}
	return layer(graphics.$get(), false, hidden);
}

function getVertexLayer(design: Design): string {
	if(design.mode != "tree") return "";
	const graphics = new SvgGraphics();
	for(const v of design.tree.$vertices) {
		graphics.$class = "vertex" + (v.$selected ? " selected" : "");
		v.$drawDot(graphics);
	}
	return layer(graphics.$get(), false);
}

function getLabelLayer(design: Design): string {
	const hidden = !settings.display.label;
	if(hidden && !includeHiddenElement) return "";
	let result = "";
	const s = ProjectService.scale.value;
	const objects: LabelView[] = [];
	if(design.mode == "layout") objects.push(...design.layout.$flaps);
	if(design.mode == "tree") {
		for(const v of design.tree.$vertices) objects.push(v);
		objects.push(...design.tree.$edges.values());
	}
	for(const obj of objects) {
		const l = obj.$label;
		const text = l.$text;
		if(text) {
			const offset = l.$offset;
			const sel = design.mode == "tree" && obj.$selected ? " " + obj.type.toLowerCase() : "";
			result += `<g transform="translate(${l.x - offset.x / s} ${l.y + offset.y / s}) scale(1 -1)">` +
				`<text class="glow">${text}</text><text class="label${sel}">${text}</text></g>`;
		}
	}
	return layer(result, false, hidden);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility
/////////////////////////////////////////////////////////////////////////////////////////////////////

function layer(content: string, clipped?: boolean, hidden?: boolean, attr?: string): string {
	attr = attr ? " " + attr : "";
	if(hidden) attr += ` class="hidden"`;
	return clipped ? `<g clip-path="url(#clip)"${attr}>${content}</g>` : `<g${attr}>${content}</g>`;
}

function toSVGPath(path: Path): string {
	let result = `M${path[0].x},${path[0].y}`;
	for(let i = 1; i < path.length; i++) {
		result += `L${path[i].x},${path[i].y}`;
	}
	return result + "Z";
}

function lineStyle(color: number, width: number, fill?: number): string {
	const sh = ProjectService.shrink.value;
	return `stroke:${toHex(color)};stroke-width:${width * sh};` +
		`fill:${fill === undefined ? "none" : toHex(fill)};vector-effect:non-scaling-stroke`;
}
