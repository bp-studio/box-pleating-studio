import { MAX_SHEET_SIZE, MAX_TREE_HEIGHT } from "shared/types/constants";
import { GridType } from "shared/json";
import { rectangularConstrain, constrainVertex, constrainFlap, diagonalConstrain } from "client/project/components/grid/constrain";

import type { JDesign, JProject, JSheet } from "shared/json";

/**
 * Since v0.6.7 we imposes hard limits on sheet sizes, tree heights, and number of vertices.
 * That means project files created before v0.6.7 could violate these limits in theory.
 *
 * Although such violations are clearly results of trolling users,
 * we still have to handle them in order to avoid triggering fatal errors.
 */
export default function $process(proj: Pseudo<JProject>): boolean {
	let deprecated = false;
	const design = proj.design as JDesign;

	// We take care of only the most trivial case here.
	// The rest will be handled by the foolproof mechanism in the Core.
	for(const e of design.tree.edges) {
		if(e.length > MAX_TREE_HEIGHT) {
			e.length = 1;
			deprecated = true;
		}
	}

	// Tree sheet
	const treeSheet = design.tree.sheet;
	if(!checkSheet(treeSheet)) {
		const constrain = createConstrainFunc(treeSheet);
		for(const n of design.tree!.nodes) {
			const v = constrainVertex(constrain, { x: n.x, y: n.y }, { x: 0, y: 0 });
			n.x += v.x;
			n.y += v.y;
		}
		deprecated = true;
	}

	// Layout sheet
	const layoutSheet = design.layout.sheet;
	if(!checkSheet(layoutSheet)) {
		const constrain = createConstrainFunc(layoutSheet);
		for(const f of design.layout.flaps) {
			f.width = Math.min(f.width, layoutSheet.width);
			f.height = Math.min(f.height, layoutSheet.height);
			const v = constrainFlap(constrain, { x: f.x, y: f.y }, f.width, f.height, { x: 0, y: 0 });
			f.x += v.x;
			f.y += v.y;
		}
		deprecated = true;
	}

	return deprecated;
}

const constrainFunc = {
	[GridType.rectangular]: rectangularConstrain,
	[GridType.diagonal]: diagonalConstrain,
};

function createConstrainFunc(sheet: JSheet) {
	return (p: IPoint) => constrainFunc[sheet.type](sheet.width, sheet.height, p);
}

function checkSheet(sheet: JSheet): boolean {
	if(sheet.height > MAX_SHEET_SIZE || sheet.width > MAX_SHEET_SIZE) {
		sheet.width = Math.min(MAX_SHEET_SIZE, sheet.width);
		sheet.height = Math.min(MAX_SHEET_SIZE, sheet.height);
		return false;
	}
	return true;
}
