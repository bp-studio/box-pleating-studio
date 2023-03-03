import ProjectService from "client/services/projectService";
import { style } from "client/services/styleService";
import { MARGIN } from "client/screen/constants";
import { SvgGraphics } from "./svgGraphics";
import { drawContours, fillContours } from "client/screen/contourUtil";
import { SelectionController } from "client/controllers/selectionController";

import type { Project } from "client/project/project";
import type { Design } from "client/project/design";
import type { Sheet } from "client/project/components/sheet";
import type { Path } from "shared/types/geometry";
import type { Flap } from "client/project/components/layout/flap";
import type { River } from "client/project/components/layout/river";

//=================================================================
/**
 * Creates SVG for the given {@link Project}.
 *
 * We don't use any fancy SVG library here and instead operate
 * on strings directly to save the overhead.
 */
//=================================================================
export function svg(proj: Project): Blob {
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

function getStyle(): string {
	const { border, hinge, junction, grid, shade } = style;
	const result =
		`.border{${lineStyle(border.color, border.width)}}` +
		`.grid{${lineStyle(grid.color, grid.width)}}` +
		`.hinge{${lineStyle(hinge.color, hinge.width)}}` +
		`.circle{${lineStyle(hinge.color, 1)}}` +
		`.shade{${lineStyle(0, 0, hinge.color)};opacity:${shade.alpha};fill-rule:evenodd}` +
		`.junction{${lineStyle(junction.color, 0, junction.color)};opacity:${junction.alpha};stroke-linejoin:bevel}`;
	return `<style>${result}</style>`;
}

function getClip(clipPath: string): string {
	return `<defs><clipPath id="clip"><path d="${clipPath}" /></clipPath></defs>`;
}

function getTransform(sheet: Sheet, height: number): string {
	const s = ProjectService.scale.value;
	const horOffset = sheet.$horizontalMargin.value;
	const verOffset = height - MARGIN;
	return `translate(${horOffset} ${verOffset}) scale(${s} ${-s})`;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Layers
/////////////////////////////////////////////////////////////////////////////////////////////////////

function getBorderLayer(sheet: Sheet, borderPath: string): string {
	let result = `<path class="border" d="${borderPath}" />`;
	if(app.settings.showGrid) {
		const graphics = new SvgGraphics();
		graphics.$class = "grid";
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
		fillContours(graphics, control.$contours, 0);
	}
	return layer(graphics.$get(), true);
}

function getEdgeLayer(design: Design): string {
	if(design.mode != "tree") return "";
	return layer("", true);
}

function getHingeLayer(design: Design): string {
	if(design.mode != "layout") return "";
	const objects = [...design.layout.$flaps.values(), ...design.layout.$rivers.values()];
	const graphics = new SvgGraphics();
	for(const obj of objects) {
		graphics.$class = "hinge";
		drawContours(graphics, obj.$contours);
		if(obj.type == "Flap") {
			graphics.$class = "circle";
			obj.$drawCircle(graphics);
		}
	}
	return layer(graphics.$get(), true);
}

function getRidgeLayer(design: Design): string {
	if(design.mode != "layout") return "";
	return layer("", true);
}

function getAxisParallelLayer(design: Design): string {
	if(design.mode != "layout") return "";
	return layer("", true);
}

function getJunctionLayer(design: Design): string {
	if(design.mode != "layout") return "";
	const s = ProjectService.scale.value;
	const graphics = new SvgGraphics();
	graphics.$class = "junction";
	for(const junction of design.layout.$junctions.values()) {
		junction.$draw(s, graphics);
	}
	return layer(graphics.$get(), true, `style="opacity:${style.junction.alpha}"`);
}

function getDotLayer(design: Design): string {
	if(design.mode != "layout") return "";
	return layer("", true);
}

function getVertexLayer(design: Design): string {
	if(design.mode != "tree") return "";
	return layer("", true);
}

function getLabelLayer(design: Design): string {
	return layer("", true);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility
/////////////////////////////////////////////////////////////////////////////////////////////////////

function layer(content: string, clipped?: boolean, attr?: string): string {
	attr = attr ? " " + attr : "";
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

function toHex(color: number): string {
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	return "#" + color.toString(16).padStart(6, "0");
}
