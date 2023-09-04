import type { Project } from "client/project/project";

//=================================================================
/**
 * {@link CoreManager} controls the calling to the Core.
 */
//=================================================================
export class CoreManager {

	private _project: Project;

	/** A {@link Promise} that resolves immediately after returning from the Core. */
	private _lastReturn: Promise<void> = Promise.resolve();

	/** A counter for the pending update calls. */
	private _updateState: number = 0;

	constructor(project: Project) {
		this._project = project;
	}

	/** Wait until the Core is free to call. */
	public $prepare(): Promise<void> {
		const ready = this._project.history.$moving || this._updateState == 0 ?
			Promise.resolve() : this._lastReturn;
		this._updateState++;
		return ready;
	}

	/** Execute a calling to the Core. */
	public $run(factory: Action<Promise<void>>): Promise<void> {
		this._lastReturn = new Promise(resolve => this._project.$onReturn(() => {
			this._updateState--;
			resolve();
		}));
		return factory();
	}
}
