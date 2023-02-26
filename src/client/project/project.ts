import { deepAssign } from "shared/utils/clone";
import { Mountable } from "client/base/mountable";
import { Migration } from "client/patches";
import { Design } from "./design";
import HistoryManager from "./changes/history";
import { options } from "client/options";

import type { CPLine } from "shared/types/cp";
import type * as Routes from "core/routes";
import type { JProject } from "shared/json";

/**
 * Id starts from 1 to ensure true values.
 */
let nextId = 1;

//=================================================================
/**
 * {@link Project} manages {@link Design} and other objects associated with it.
 */
//=================================================================
export class Project extends Mountable implements IAsyncSerializable<JProject> {

	public readonly id: number;
	public readonly design: Design;
	public readonly history: HistoryManager;

	private readonly _worker: Worker;

	/** Whether self has been initialized. */
	private _initialized: boolean = false;

	public $isDragging: boolean = false;

	constructor(json: RecursivePartial<JProject>, worker: Worker) {
		// Projects are all inactive on construction.
		// It will become active when selected later (see ProjectService)
		super(false);

		this.id = nextId++;

		const jProject = deepAssign(Migration.$getSample(), json);

		this.design = new Design(this, jProject.design);
		this.$addChild(this.design);

		this._worker = worker;

		this.history = new HistoryManager();

		this._onDispose(() => this._worker.terminate());
	}

	/** Initialization. */
	public async $initialize(): Promise<Project> {
		if(DEBUG_ENABLED && !this._initialized) {
			console.time("First render");
		}

		await this.$callStudio("design", "init", this.design.$prototype);
		await Vue.nextTick();

		if(DEBUG_ENABLED && !this._initialized) {
			console.timeEnd("First render");
		}

		this._initialized = true;
		return this;
	}

	public async toJSON(session: boolean = false): Promise<JProject> {
		return {
			version: Migration.$getCurrentVersion(),
			design: await this.design.toJSON(),
		};
	}

	public async $getCP(): Promise<CPLine[]> {
		const borders = this.design.layout.$sheet.grid.$getBorderPath();
		return await this.$callStudio("layout", "getCP", borders);
	}

	public async $callStudio<C extends Routes.ControllerKeys, A extends Routes.ActionKeys<C>>(
		controller: C, action: A, ...args: Routes.ActionArguments<C, A>
	): Promise<Routes.ActionResult<C, A>> {
		const request: Routes.IStudioRequest<C, A> = { controller, action, value: args };
		const response = await app.callWorker<Routes.StudioResponse>(this._worker, request);
		if("error" in response) {
			this.design.sheet.$view.interactiveChildren = false; // Stop hovering effect
			if(this._initialized) {
				// Display a fatal message and close self, if the project has already been initialized.
				// If not, the error thrown below will be caught by the App.
				await options.onError?.(this.id, response.error);
			}
			throw new Error(response.error); // Stop all further actions.
		} else if("update" in response) {
			this.design.$update(response.update);
			return undefined as Routes.ActionResult<C, A>;
		} else {
			return response.value as Routes.ActionResult<C, A>;
		}
	}
}
