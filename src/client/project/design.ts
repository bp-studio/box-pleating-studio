import { Container } from "pixi.js";

import { shallowRef } from "client/shared/decorators";
import { View } from "client/base/view";
import { designs } from "client/screen/display";
import { ValuedIntDoubleMap } from "shared/data/doubleMap/valuedIntDoubleMap";
import { Sheet } from "./components/sheet";
import { MOUNTED } from "client/base/mountable";

import type { IDoubleMap } from "shared/data/doubleMap/iDoubleMap";
import type { Vertex } from "./components/tree/vertex";
import type { DesignMode, JDesign } from "shared/json";
import type { Edge } from "./components/tree/edge";

//=================================================================
/**
 * {@link Design}
 */
//=================================================================
export class Design extends View {

	@shallowRef public title: string;
	@shallowRef public description: string;
	@shallowRef public mode: DesignMode;

	public readonly $layoutSheet: Sheet;
	public readonly $treeSheet: Sheet;

	public readonly $vertices: Map<number, Vertex> = new Map();
	public readonly $edges: IDoubleMap<number, Edge> = new ValuedIntDoubleMap();

	constructor(json: RecursivePartial<JDesign>, id: number) {
		super();
		this.title = json?.title ?? "";
		this.description = json?.description ?? "";
		this.mode = json?.mode ?? "layout";

		const view = this.$addRootObject(new Container(), designs);
		this.addEventListener(MOUNTED, e => view.visible = e.state);

		this.$layoutSheet = new Sheet(json?.layout?.sheet, view);
		this.$treeSheet = new Sheet(json?.tree?.sheet, view);
		this.$addChild(this.$layoutSheet);
		this.$addChild(this.$treeSheet);

		this.$reactDraw(this._onModeChanged);

		if(DEBUG_ENABLED) {
			view.name = "Design #" + id;
			this.$layoutSheet.$view.name = "LayoutSheet";
			this.$treeSheet.$view.name = "TreeSheet";
		}
	}

	public get sheet(): Sheet {
		return this.mode == "layout" ? this.$layoutSheet : this.$treeSheet;
	}

	public toJSON(): JDesign {
		return {
			title: this.title,
			mode: this.mode,
			layout: {
				sheet: this.$layoutSheet.toJSON(),
			},
			tree: {
				sheet: this.$treeSheet.toJSON(),
			},
		} as JDesign;
	}

	public get patternNotFound(): boolean {
		return false;
	}

	private _onModeChanged(): void {
		const mode = this.mode;
		this.$layoutSheet.$toggle(mode === "layout");
		this.$treeSheet.$toggle(mode === "tree");
	}
}
