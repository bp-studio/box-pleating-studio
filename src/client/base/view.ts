import { effectScope, watchEffect } from "vue";

import { ACTIVE, Mountable, MOUNTED } from "./mountable";

import type { EffectScope } from "vue";
import type { Container } from "@pixi/display";

//=================================================================
/**
 * {@link View} is a component that draws on the screen.
 */
//=================================================================
export abstract class View extends Mountable {

	/** The top-level {@link Container}s of this component. */
	private readonly _rootContainers: Container[] = [];

	/**
	 * {@link EffectScope} of this {@link View}.
	 *
	 * Since Vue 3.5, EffectScope now has the functionality of pause and resume,
	 * so there's no more need to implement them ourselves.
	 */
	private _drawScope: EffectScope = effectScope();

	/** Setup action for the {@link _drawScope}. */
	private _setup: Action | null = null;

	/// #if DEBUG
	/** Guard the running of {@link $react} method. */
	private _scopeInitialized: boolean = false;
	/// #endif

	constructor(active: boolean = true) {
		super(active);

		this._onDestruct(() => {
			this._drawScope.stop();
			this._rootContainers.forEach(view => view.destroy({ children: true }));
		});

		this.addEventListener(ACTIVE, event => {
			// Visibilities of the top-level containers depend on the active state.
			this._rootContainers.forEach(view => view.visible = event.state);
		});

		this.addEventListener(MOUNTED, event => {
			// Whether the scope is activated depends on the mounted state.
			if(event.state) {
				if(this._setup) {
					this._drawScope.run(this._setup);
					this._setup = null;
				}
				this._drawScope.resume();
			} else {
				this._drawScope.pause();
			}
		});
	}

	/**
	 * Add a top-level object.
	 * The implementation here assumes that the method is called only once for the same object.
	 *
	 * All top-level objects gets destructed as the {@link View} destructs.
	 */
	protected $addRootObject<T extends Container>(object: T, target?: Container): T {
		this._rootContainers.push(object);
		target?.addChild(object);
		return object;
	}

	/**
	 * Low-level method for starting the scope.
	 *
	 * This method should only be called once.
	 */
	protected $react(setup: Action): void {
		/// #if DEBUG
		if(this._scopeInitialized) throw new Error("React scope already started.");
		this._scopeInitialized = true;
		/// #endif

		// Here we only register the setup action.
		// It will execute during the first mounting.
		this._setup = setup;
	}

	/**
	 * Register a reactive drawing method.
	 * All passed-in methods will be bound to `this`.
	 *
	 * This method should only be called once.
	 */
	protected $reactDraw(...actions: Action[]): void {
		this.$react(() => {
			for(const action of actions) watchEffect(action.bind(this));
		});
	}
}
