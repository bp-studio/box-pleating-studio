import { deepAssign } from "shared/utils/clone";
import { Mountable } from "client/base/mountable";
import { Migration } from "client/patches";
import { Design } from "./design";
import HistoryManager from "./changes/history";
import { options } from "client/options";
import { doEvents } from "shared/utils/async";
import { shallowRef } from "client/shared/decorators";

import type { Route, CoreResponse } from "core/routes";
import type { JProject } from "shared/json";
import type { UpdateModel } from "core/service/updateModel";

/**
 * Id starts from 1 to ensure true values.
 */
let nextId = 1;

//=================================================================
/**
 * {@link Project} manages {@link Design} and other objects associated with it.
 */
//=================================================================
export class Project extends Mountable implements ISerializable<JProject> {

	public readonly id: number;
	public readonly design: Design;
	public readonly history: HistoryManager;

	/**
	 * A {@link Proxy} object that represents the controllers and actions of the Core.
	 * This greatly improves the typing and code navigating for the Core APIs.
	 *
	 * Typical route will return a {@link Promise} that resolves after
	 * {@link Design.$update Design.$update()} is completed.
	 */
	public readonly $core: Route;

	private readonly _worker: Worker;

	/** Whether self has been initialized. */
	private _initialized: boolean = false;

	private readonly _updateCallbacks: Action[] = [];
	private _updateCallbackTimeout: number | undefined;

	private readonly _returnCallbacks: Action[] = [];

	/**
	 * Whether the user is performing dragging on the current {@link Project}.
	 * This is made {@link shallowRef} as {@link HistoryManager.isModified} depends on it.
	 */
	@shallowRef public $isDragging: boolean = false;

	constructor(json: RecursivePartial<JProject>, worker: Worker) {
		// Projects are all inactive on construction.
		// It will become active when selected later (see ProjectService)
		super(false);

		this.id = nextId++;

		const jProject = deepAssign(Migration.$getSample(), json);

		this.history = new HistoryManager(this, jProject.history);
		this.design = new Design(this, jProject.design, jProject.state);
		this.$addChild(this.design);

		this._worker = worker;
		this.$core = this._createCoreProxy();

		this._onDestruct(() => this._worker.terminate());
	}

	/** Initialization. */
	public async $initialize(): Promise<Project> {
		if(DEBUG_ENABLED && !this._initialized) {
			console.time("First render #" + this.id);
		}

		await this.$core.design.init(this.design.$prototype);

		// Wait for rendering to complete.
		// Originally `Vue.nextTick()` was used here, but it is later
		// discovered that such an approach will lead to memory leaks.
		await doEvents();

		if(DEBUG_ENABLED && !this._initialized) {
			console.timeEnd("First render #" + this.id);
		}

		this._initialized = true;
		return this;
	}

	public toJSON(session?: true): JProject {
		return {
			version: Migration.$getCurrentVersion(),
			design: this.design.toJSON(session),
			history: session && this.history.toJSON(),
			state: session && {
				tree: this.design.tree.$sheet.$getViewport(),
				layout: this.design.layout.$sheet.$getViewport(),
			},
		};
	}

	/**
	 * Setup a one-time callback after the update routine
	 * (and before flushing the history).
	 * If the Core is not invoked in the current round,
	 * the callback will be invoked by a zero timeout.
	 */
	public $onUpdate(callback: Action): void {
		this._updateCallbacks.push(callback);
		this._updateCallbackTimeout ||= setTimeout(() => this._flushUpdateCallback(), 0);
	}

	/**
	 * Setup a one-time callback immediately after returning from the Core.
	 */
	public $onReturn(callback: Action): void {
		this._returnCallbacks.push(callback);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _createCoreProxy(): Route {
		return new Proxy({}, {
			get: (controllers: Record<string, object>, controller: string) =>
				controllers[controller] ||= this._createControllerProxy(controller),
		}) as Route;
	}

	private _createControllerProxy(controller: string): Record<string, Action> {
		return new Proxy({}, {
			get: (actions: Record<string, Action>, action: string) =>
				actions[action] ||= (...args: unknown[]) => this._callCore(controller, action, args),
		});
	}

	/**
	 * Send a request to the Core worker and obtain a direct result or an {@link UpdateModel}.
	 */
	private async _callCore(controller: string, action: string, args: unknown[]): Promise<unknown> {
		clearTimeout(this._updateCallbackTimeout);
		const request = { controller, action, value: args };
		const callbacks = this._returnCallbacks.concat();
		this._returnCallbacks.length = 0;
		const response = await app.callWorker<CoreResponse>(this._worker, request);
		for(const callback of callbacks) callback();
		if("error" in response) {
			this.design.sheet.$view.interactiveChildren = false; // Stop hovering effect
			if(this._initialized) {
				// Display a fatal message and close self, if the project has already been initialized.
				// If not, the error thrown below will be caught by the App.
				await options.onError?.(this.id, response.error, this.history.$backup);
			}
			throw new Error(response.error); // Stop all further actions.
		} else if("update" in response) {
			this.design.$update(response.update, () => this._flushUpdateCallback());
		} else {
			return response.value;
		}
	}

	private _flushUpdateCallback(): void {
		for(const callback of this._updateCallbacks) callback();
		this._updateCallbacks.length = 0;
		this._updateCallbackTimeout = undefined;
	}
}
