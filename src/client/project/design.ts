import { Container } from "@pixi/display";

import { shallowRef } from "client/shared/decorators";
import { View } from "client/base/view";
import { designs } from "client/screen/display";
import { MOUNTED } from "client/base/mountable";
import { Tree } from "./components/tree/tree";
import { Layout } from "./components/layout/layout";
import { SelectionController } from "client/controllers/selectionController";
import { Flap } from "./components/layout/flap";
import { isTypedArray } from "client/utils/array";
import { River } from "./components/layout/river";
import { Vertex } from "./components/tree/vertex";
import { Edge } from "./components/tree/edge";

import type { Sheet } from "./components/sheet";
import type { Project } from "./project";
import type { UpdateModel } from "core/service/updateModel";
import type { DesignMode, JDesign } from "shared/json";

//=================================================================
/**
 * {@link Design} 是專案當中的主角。
 */
//=================================================================
export class Design extends View implements IAsyncSerializable<JDesign> {

	@shallowRef public title: string;
	@shallowRef public description: string;
	@shallowRef public mode: DesignMode;

	public readonly layout: Layout;
	public readonly tree: Tree;

	/** 在物件尚未建立之前，用來暫存各種物件的原型資料 */
	public readonly $prototype: JDesign;

	constructor(project: Project, json: JDesign) {
		super();
		this.$prototype = json;
		this.title = json.title ?? "";
		this.description = json.description ?? "";
		this.mode = json.mode ?? "layout";

		const view = this.$addRootObject(new Container(), designs);
		this.addEventListener(MOUNTED, e => view.visible = e.state);

		this.layout = new Layout(project, view, json.layout.sheet);
		this.tree = new Tree(project, view, json.tree);
		this.$addChild(this.layout.$sheet);
		this.$addChild(this.tree.$sheet);

		this.$reactDraw(this._onModeChanged);

		if(DEBUG_ENABLED) view.name = "Design #" + project.id;
	}

	public get sheet(): Sheet {
		return this.mode == "layout" ? this.layout.$sheet : this.tree.$sheet;
	}

	public async toJSON(): Promise<JDesign> {
		return {
			title: this.title,
			mode: this.mode,
			layout: this.layout.toJSON(),
			tree: await this.tree.toJSON(),
		};
	}

	public get patternNotFound(): boolean {
		return false;
	}

	/** 根據 Core 傳回的更新模型來進行更新 */
	public $update(model: UpdateModel): void {
		this.layout.$cleanUp(model);
		this.tree.$update(model);
		this.layout.$update(model);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 介面方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public goToDual(): void {
		const selections = SelectionController.selections;
		if(this.mode == "layout") {
			if(isTypedArray(selections, Flap)) this.layout.$goToDual(selections);
			else if(selections[0] instanceof River) this.layout.$goToDual(selections[0]);
		} else {
			if(isTypedArray(selections, Vertex)) this.tree.$goToDual(selections);
			else if(selections[0] instanceof Edge) this.tree.$goToDual(selections[0]);
		}
	}

	public delete(): void {
		//
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _onModeChanged(): void {
		const mode = this.mode;
		this.layout.$sheet.$toggle(mode === "layout");
		this.tree.$sheet.$toggle(mode === "tree");
	}
}
