import { deepAssign } from "client/utils/deepAssign";
import { Mountable } from "client/base/mountable";
import { Migration } from "client/patches";
import { Design } from "./design";
import HistoryManager from "./changes/history";
import { shallowRef } from "client/shared/decorators";

import type * as Routes from "core/routes";
import type { JProject, JTree } from "shared/json";

/**
 * 號碼從 1 號開始，以確保真值。
 */
let nextId = 1;

//=================================================================
/**
 * {@link Project} 是一個開啟的專案。
 */
//=================================================================
export class Project extends Mountable {

	public readonly id: number;
	public readonly design: Design;
	public readonly history: HistoryManager;

	private readonly _worker: Worker;

	/** 是否已經初始化；僅在偵錯模式中使用 */
	private _initialized?: boolean;

	@shallowRef public $isDragging: boolean = false;

	constructor(json: RecursivePartial<JProject>, worker: Worker) {
		// Project 剛建構出來的時候都是非活躍的，
		// 稍後會在選取的時候才變成活躍（參見 ProjectService）
		super(false);

		this.id = nextId++;

		const jProject = deepAssign(Migration.$getSample(), json);

		this.design = new Design(jProject.design, this.id);
		this.$addChild(this.design);

		this._worker = worker;

		this.history = new HistoryManager();

		this._onDispose(() => this._worker.terminate());
	}

	/** 初始化處理 */
	public async $initialize(): Promise<Project> {
		if(DEBUG_ENABLED && !this._initialized) {
			console.time("First render");
		}

		await this._callStudio("design", "init", this.design.$prototype);
		await Vue.nextTick();

		if(DEBUG_ENABLED && !this._initialized) {
			this._initialized = true;
			console.timeEnd("First render");
		}
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
			this.design.$update(response.update);
			return undefined as Routes.ActionResult<C, A>;
		} else {
			return response.value as Routes.ActionResult<C, A>;
		}
	}
}
