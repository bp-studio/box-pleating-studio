/**
 * shrewd v0.0.11
 * (c) 2019-2021 Mu-Tsun Tsai
 * Released under the MIT License.
 */

/**
 *  Provides connection to 3rd party reactive frameworks.
 */
interface IHook {
	/**
	 * Trigger a "read" operation to record dependency.
	 * 
	 * Returns whether a dependency is established.
	 */
	read(id: number): boolean;

	/** Trigger a "write" operation to notify changes. */
	write(id: number): void;

	/**
	 * Garbage collection; clearing up unsubscribed entries.
	 * This method is called at the end of each committing stage.
	 * 
	 * Returns an array of id's that were cleaned-up.
	 */
	gc(): number[];

	/** If the given Observable has 3rd party subscribers. */
	sub(id: number): boolean;
}

/**
 * A constructor of an IHook.
 */
interface IHookConstructor {
	new(...args: any): IHook;
}

/**
 * Enable strict mode in TypeScript to allow type checking for this interface.
 */
interface IDecoratorOptions<T> {

	/** Validator for ObservableProperty. */
	validator?: (value: T) => boolean;

	/** Renderer function for ObservableProperty. */
	renderer?: (value: T) => T;
}

/**
 * The `@shrewd` decorator makes a class reactive,
 * and it turns a field into an `ObservableProperty`,
 * a get accessor into a `ComputedProperty`, and a method into a `ReactiveMethod`.
 */

// For classes.
 export function shrewd<
	// We use `Function` here to make it compatible with abstract classes,
	// although one doesn't have to add the @shrewd decorator on such classes.
	T extends Function
>(constructor: T): T;

// For `ObservableProperty` with options.
export function shrewd<T>(option: IDecoratorOptions<T>): PropertyDecorator;

// For `ObservableProperty`.
export function shrewd(target: object, prop: PropertyKey): void;

// For `ComputedProperty` and `ReactiveMethod`.
export function shrewd(target: object, prop: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor;

/**
 * Manually triggers the commission. Under the default settings (with auto-commit) there is
 * no need to call this method, except for the case where the reactive results are immediately
 * required for further non-reactive actions.
 */
export function commit(): void;

/**
 * Terminates a Shrewd object. The said object will cancel all its subscriptions (to and from others),
 * and can no longer be subscribed. A Shrewd object must be terminated to allow garbage-collecting.
 * Any changes made before the termination will still propagate in the committing stage.
 */
export function terminate(target: object): void;

/**
 * Built-in hooks.
 */
export const hook: {

	/** The default hook that does nothing. */
	default: IHookConstructor,

	/** Hook for Vue.js. */
	vue: IHookConstructor
};

interface IShrewdOption {

	/**
	 * Hook for 3rd party frameworks. The default hook is an instance of Shrewd.hook.default.
	 */
	hook: IHook;

	/**
	 * Whether to use auto-commit. The default value is true.
	 * However, setting it to false and calling Shrewd.commit() periodically
	 * might result in better performance for some applications.
	 */
	autoCommit: boolean;

	/**
	 * Whether to pause when Shrewd detects problem and when a debugger is available.
	 * The default value is true.
	 */
	debug: boolean;
}

/**
 * Shrewd global options.
 */
export const option: IShrewdOption;

/**
 * ShrewdObject symbol, for debug purpose.
 */
export const symbol: Symbol;

export as namespace Shrewd;
