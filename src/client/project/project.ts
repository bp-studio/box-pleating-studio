import { deepAssign } from "client/utils/deepAssign";
import { Mountable } from "client/base/mountable";
import { Migration } from "client/patches";
import { Design } from "./design";
import HistoryManager from "./changes/history";
import { Vertex } from "./components/tree/vertex";
import { Edge } from "./components/tree/edge";
import { Flap } from "./components/layout/flap";
import { River } from "./components/layout/river";

import type * as Routes from "core/routes";
import type { JDesign, JProject, JTree } from "shared/json";
import type { UpdateModel } from "core/service/updateModel";

/**
 * 號碼從 1 號開始，以確保真值。
 */
let nextId = 1;

//=================================================================
/**
 * {@link Project}
 */
//=================================================================
export class Project extends Mountable {

	public readonly id: number;
	public readonly design: Design;
	public readonly history: HistoryManager;

	private readonly _worker: Worker;
	private _pendingDesign?: JDesign;

	constructor(json: RecursivePartial<JProject>, worker: Worker) {
		// Project 剛建構出來的時候都是非活躍的，
		// 稍後會在選取的時候才變成活躍（參見 ProjectService）
		super(false);

		this.id = nextId++;

		const jProject = deepAssign(Migration.$getSample(), json);

		this._pendingDesign = jProject.design;
		this.design = new Design(jProject.design, this.id);
		this.$addChild(this.design);

		this._worker = worker;

		this.history = new HistoryManager();

		this._onDispose(() => this._worker.terminate());
	}

	/** 初始化處理 */
	public async $initialize(): Promise<Project> {
		await this._callStudio("design", "init", this._pendingDesign!);
		await Vue.nextTick();
		return this;
	}

	public async toJSON(session: boolean = false): Promise<JProject> {
		// TODO
		const json = await this._callStudio("design", "json");
		const design = this.design.toJSON();
		design.tree = json!.tree as JTree;
		return {
			version: Migration.$getCurrentVersion(),
			design,
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private async _callStudio<C extends Routes.ControllerKeys, A extends Routes.ActionKeys<C>>(
		controller: C, action: A, ...args: Routes.ActionArguments<C, A>
	): Promise<Routes.ActionResult<C, A>> {
		const request: Routes.IStudioRequest<C, A> = { controller, action, value: args };
		const response = await app.callWorker<Routes.StudioResponse>(this._worker, request);
		if("error" in response) {
			throw new Error(response.error);
		} else if("update" in response) {
			this._update(response.update);
			return undefined as Routes.ActionResult<C, A>;
		} else {
			return response.value as Routes.ActionResult<C, A>;
		}
	}

	private _update(model: UpdateModel): void {
		if(DEBUG_ENABLED) console.time("First render");

		// TODO
		if(this._pendingDesign) {
			// 初始化模式
			const treeSheet = this.design.$treeSheet;
			const layoutSheet = this.design.$layoutSheet;
			for(const node of model.add.nodes) {
				const json = this._pendingDesign.tree.nodes.find(n => n.id == node);
				if(!json) continue;
				const vertex = new Vertex(json, treeSheet);
				treeSheet.$addChild(vertex);
				this.design.$vertices.set(json.id, vertex);
			}
			for(const e of model.add.edges) {
				const v1 = this.design.$vertices.get(e.n1);
				const v2 = this.design.$vertices.get(e.n2);
				if(!v1 || !v2) continue;
				const edge = new Edge(v1, v2, e.length, treeSheet);
				treeSheet.$addChild(edge);
				this.design.$edges.set(v1.id, v2.id, edge);
			}

			for(const f of this._pendingDesign.layout.flaps) {
				f.contour = model.graphics["f" + f.id].contours!;
				const vertex = this.design.$vertices.get(f.id)!;
				const edge = this.design.$edges.get(f.id)!.values().next().value;
				const flap = new Flap(f, vertex, edge, layoutSheet);
				layoutSheet.$addChild(flap);
			}
			for(const e of this._pendingDesign.tree.edges) {
				const { n1, n2 } = e;
				const tag = n1 < n2 ? `re${n1},${n2}` : `re${n2},${n1}`;
				if(!model.graphics[tag]) continue;
				const river = new River(tag, model.graphics[tag].contours!, layoutSheet);
				layoutSheet.$addChild(river);
			}

			delete this._pendingDesign;
		}

		if(DEBUG_ENABLED) {
			Vue.nextTick(() => console.timeEnd("First render"));
		}
	}
}
