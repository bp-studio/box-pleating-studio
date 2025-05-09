import { deepAssign } from "shared/utils/clone";
import { Mountable } from "client/base/mountable";
import { Migration } from "client/patches";
import { Design } from "./design";
import HistoryManager from "./changes/history";
import { options } from "client/options";
import { shallowRef } from "client/shared/decorators";
import { callWorker } from "app/utils/workerUtility";

import type { Route, CoreResponse, ErrorResponse, CoreRequest } from "core/routes";
import type { CoreError, JProject, ProjId } from "shared/json";
import type { UpdateModel } from "core/service/updateModel";

const CORE_TIMEOUT = 3000;

/**
 * Id starts from 1 to ensure true values.
 */
let nextId = 1;

export function getNextId(): ProjId {
	return nextId++ as ProjId;
}

//=================================================================
/**
 * {@link Project} manages {@link Design} and other objects associated with it.
 */
//=================================================================
export class Project extends Mountable implements ISerializable<JProject> {

	public static $onFatalError: Action;

	public readonly id: ProjId;
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

	/** Indicating that we're in a fatal error state. */
	private _fatal: boolean = false;

	private readonly _updateCallbacks: Action[] = [];
	private _updateCallbackTimeout: number | undefined;

	private readonly _returnCallbacks: Action[] = [];

	/**
	 * Whether the user is performing dragging on the current {@link Project}.
	 * This is made {@link shallowRef} as {@link HistoryManager.isModified} depends on it.
	 */
	@shallowRef public accessor $isDragging: boolean = false;

	constructor(json: RecursivePartial<JProject>, worker: Worker) {
		// Projects are all inactive on construction.
		// It will become active when selected later (see ProjectService)
		super(false);
		this.id = getNextId();
		const jProject = deepAssign(Migration.$getSample(), json);

		this.history = new HistoryManager(this, jProject.history);
		this.design = new Design(this, jProject.design, jProject.state);
		this.$addChild(this.design);

		this._worker = worker;
		this.$core = this.$createCoreProxy();

		this._onDestruct(() => this._worker.terminate());
	}

	/** Initialization. */
	public async $initialize(): Promise<Project> {
		/// #if DEBUG
		if(!this._initialized) console.time("First render #" + this.id);
		/// #endif

		await this.$core.design.init(this.design.$prototype);

		// Wait for rendering to complete.
		// Originally `Vue.nextTick()` was used here, but it is later
		// discovered that such an approach will lead to memory leaks.
		await scheduler.yield();

		/// #if DEBUG
		if(!this._initialized) console.timeEnd("First render #" + this.id);
		/// #endif

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

	/**
	 * Currently there's no way to directly get the full async stack trace,
	 * so in case we need to invoke {@link _callCore} in an async stack,
	 * we have to manually record the stack trace before we enter the async parts.
	 */
	public $createCoreProxy(stack?: string): Route {
		return new Proxy({}, {
			get: (controllers: Record<string, object>, controller: string) =>
				controllers[controller] ||= this._createControllerProxy(controller, stack),
		}) as Route;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _createControllerProxy(controller: string, stack?: string): Record<string, Action> {
		return new Proxy({}, {
			get: (actions: Record<string, Action>, action: string) =>
				actions[action] ||= (...args: unknown[]) => this._callCore(controller, action, args, stack),
		});
	}

	/**
	 * Send a request to the Core worker and obtain a direct result or an {@link UpdateModel}.
	 */
	private async _callCore(controller: string, action: string, args: unknown[], stack?: string): Promise<unknown> {
		// There could be pending calling after fatal error.
		// In that case we throw an error to stop further processing.
		if(this._fatal) throw new Error();

		// Create one here if the client stack trace is not provided.
		stack ??= new Error().stack || "";

		clearTimeout(this._updateCallbackTimeout);
		const request = { controller, action, value: args } as CoreRequest;
		const callbacks = this._returnCallbacks.concat();
		this._returnCallbacks.length = 0;
		const response = await callCore(this._worker, request);
		for(const callback of callbacks) callback();
		if("error" in response) {
			await this._handleCoreError(request, response, stack);
		} else if("update" in response) {
			this.design.$update(response.update);
			this._flushUpdateCallback();
			this.history.$flush(); // Note that the flushing is also invoked on initialization
			this.design.$resetPrototype();
		} else {
			return response.value;
		}
	}

	private async _handleCoreError(request: object, response: ErrorResponse, stack: string): Promise<never> {
		this.design.sheet.$view.interactiveChildren = false; // Stop hovering effect
		if(this._initialized && !this._fatal) {
			this._fatal = true;
			// Display a fatal message and close self, if the project has already been initialized.
			// If not, the error thrown below will be caught by the App.
			const coreError = response.error;
			coreError.clientTrace = stack;
			coreError.request = request;
			Project.$onFatalError();
			await options.onError?.(this.id, coreError, this.history.$backup);
		}
		throw new Error(); // Stop all further actions.
	}

	private _flushUpdateCallback(): void {
		for(const callback of this._updateCallbacks) callback();
		this._updateCallbacks.length = 0;
		this._updateCallbackTimeout = undefined;
	}
}

function callCore(worker: Worker, request: CoreRequest): Promise<CoreResponse> {
	return new Promise(resolve => {
		// Setup a timeout mechanism.
		const timeout = setTimeout(() => {
			/// #if DEBUG
			// We don't kill the worker in debug mode to allow debugging the issue.
			console.error("Core computation timeout.");
			/// #else
			worker.terminate(); // Terminate immediately in this case
			resolve({
				error: {
					message: "Computation timeout",
					coreTrace: "",
				} as CoreError,
			});
			/// #endif
		}, CORE_TIMEOUT);
		callWorker<CoreResponse>(worker, request).then(response => {
			clearTimeout(timeout);
			resolve(response);
		});
	});
}
