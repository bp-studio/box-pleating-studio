import type { DesignMode, JDesign, JProject } from "shared/json";

/** Separates {@link JDesign} */
export default function $process(proj: Pseudo<JProject>): boolean {
	proj.design = {
		title: proj.title,
		description: proj.description,
		mode: proj.mode,
		layout: proj.layout,
		tree: proj.tree,
	} as JDesign;

	delete proj.title;
	delete proj.description;
	delete proj.mode;
	delete proj.layout;
	delete proj.tree;

	moveState(proj, "layout");
	moveState(proj, "tree");

	return false;
}

function moveState(proj: Pseudo<JProject>, key: DesignMode): void {
	const sheet = proj.design?.[key]?.sheet;
	if(sheet && "scroll" in sheet) {
		proj.state = Object.assign(proj.state ?? {}, {
			[key]: {
				scroll: sheet.scroll,
				zoom: sheet.zoom,
			},
		});
		delete sheet.scroll;
		delete sheet.zoom;
	}
}
