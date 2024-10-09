/* eslint-disable max-classes-per-file */
import { Destructible } from "./destructible";

import type { DestructibleEventMap } from "./destructible";

//=================================================================
/**
 * {@link Mountable} is a component that can be mounted.
 * "Mounting" refers to the action of loading it into view.
 *
 * For example, a stretch may contain many different patterns,
 * but only one pattern will be mounted at the same time.
 * Although the other pattern exists in memory for the time being,
 * they will not establish control items or draw on the screen.
 */
//=================================================================
export abstract class Mountable extends Destructible {

	private readonly _children: Mountable[] = [];

	/** Local state of {@link $isActive}. */
	private _active: boolean;

	/**
	 * Whether parent is `null` or is mounted.
	 * The initial value is `true`, since the parent relations
	 * are always established after the constructors.
	 */
	private _parentIsNullOrMounted: boolean = true;

	/** The cached value of {@link $mounted}, used for comparing changes. */
	private _mounted: boolean;

	constructor(active: boolean = true) {
		super();
		this._active = active;
		this._mounted = this.$mounted;

		/**
		 * {@link Mountable} will destruct all children on destructing,
		 * so there's no need to call destructing separately.
		 */
		this._onDestruct(() => {
			for(const child of this._children) {
				child.$destruct();
			}
			this.removeEventListener(MOUNTED, handler);
		});

		const handler = (): void => {
			for(const child of this._children) {
				child._parentIsNullOrMounted = this.$mounted;
				child._updateMountedState();
			}
		};
		this.addEventListener(MOUNTED, handler);
	}

	/** Whether self is active relative to the parent object. */
	protected get $isActive(): boolean {
		return this._active;
	}

	/** Add child objects; the significance of child objects is that they will be destructed together. */
	public $addChild(child: Mountable): void {
		child._parentIsNullOrMounted = this.$mounted;
		child._updateMountedState();
		this._children.push(child);
	}

	public $removeChild(child: Mountable): void {
		const index = this._children.indexOf(child);
		if(index < 0) return;
		const length = this._children.length - 1;
		this._children[index] = this._children[length];
		this._children.length = length;
	}

	protected get $mounted(): boolean {
		return this._parentIsNullOrMounted && this._active;
	}

	/**
	 * Toggle active state.
	 *
	 * This action does not change the relatively active state of child objects.
	 */
	public $toggle(active: boolean): void {
		if(this.$destructed || this._active == active) return;

		this.dispatchEvent(new StateChangedEvent(ACTIVE, active));
		this._active = active;
		this._updateMountedState();
	}

	private _updateMountedState(): void {
		if(this.$destructed) return;
		const mounted = this.$mounted;
		if(this._mounted == mounted) return;
		this.dispatchEvent(new StateChangedEvent(MOUNTED, mounted));
		this._mounted = mounted;
	}
}

export interface Mountable extends Destructible {
	addEventListener<T extends keyof MountableEventMap>(
		type: T,
		callback: Consumer<MountableEventMap[T]>,
		options?: boolean | AddEventListenerOptions): void;
}

/**
 * The event for mounting state change. This event propagates downwards.
 */
export const MOUNTED = "stateChanged:mounted";

/**
 * The event for active state change. This event does not propagate downwards.
 */
export const ACTIVE = "stateChanged:active";

interface MountableEventMap extends DestructibleEventMap {
	[MOUNTED]: StateChangedEvent;
	[ACTIVE]: StateChangedEvent;
}

/** A state change event. */
class StateChangedEvent extends Event {
	constructor(type: string, public readonly state: boolean) {
		super(type);
	}
}
