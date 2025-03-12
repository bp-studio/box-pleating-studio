import type { Route } from "core/routes";
import type { Project } from "client/project/project";

//=================================================================
/**
 * {@link CoreManager} schedules the rapid calling to the Core.
 */
//=================================================================
export class CoreManager {

	public readonly $project: Project;

	/** A {@link Promise} that resolves immediately after returning from the Core. */
	private _lastReturn: Promise<void> = Promise.resolve();

	/** A counter for the pending update calls. */
	private _pendingUpdateCount: number = 0;

	/** The current updating process. */
	private _updating: Promise<void> = Promise.resolve();

	constructor(project: Project) {
		this.$project = project;
	}

	/** The current updating process. */
	public get $updating(): Promise<void> {
		return this._updating;
	}

	/** Wait until the Core is free to call. */
	public $prepare(): Promise<void> {
		const ready = this.$project.history.$moving || this._pendingUpdateCount == 0 ?
			Promise.resolve() : this._lastReturn;
		this._pendingUpdateCount++;
		return ready;
	}

	/** Execute a calling to the Core. */
	public $run(stack: string, factory: Func<Route, Promise<void>>): Promise<void> {
		this._lastReturn = new Promise(resolve => this.$project.$onReturn(() => {
			this._pendingUpdateCount--;
			resolve();
		}));
		return this._updating = factory(this.$project.$createCoreProxy(stack));
	}
}
