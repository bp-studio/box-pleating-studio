
/**
 * The constructor of type `T` (default `unknown`).
 */
type Constructor<T = unknown> = abstract new (...args: any[]) => T;

/**
 * A function that returns `T` (default `void`).
 */
type Action<T = void> = (...args: any[]) => T;

/**
 * A function that accepts `A` and returns `B`.
 */
type Func<A, B> = (a: A) => B;

/**
 * A function that accepts `T` and returns boolean value.
 */
type Predicate<T> = Func<T, boolean>;

/**
 * A function that accepts `A`.
 */
type Consumer<A> = Func<A, void>;

/**
 * A function that returns `T` or {@link Promise Promise}`<T>`.
 */
type Awaitable<T> = T | Promise<T>;

/**
 * Remove the restrictions of `readonly`.
 */
type Writeable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * The name of the properties in type `O` that are of type `T`.
 */
type KeysOfType<O, T> = {
	[K in keyof O]: O[K] extends T ? K : never
}[keyof O];

// We add undefined here so that the nested properties will be compatible with RecursivePartial
type RecursivePartial<T> = { [P in keyof T]?: RecursivePartial<T[P]> } | undefined;

type PseudoValue<T> =
	T extends (infer U)[] ? PseudoValue<U>[] :
	T extends object ? Pseudo<T> : T;
type OtherKeys<T, V> = Partial<Record<Exclude<string, keyof T>, V>>;
type PartialPseudo<T> = { [key in keyof T]?: PseudoValue<T[key]> };

/**
 * In addition to being a {@link RecursivePartial}, there could also be some other
 * properties remaining from the old format (the values are all assumed to be `unknown`).
 */
type Pseudo<T> = (T | PartialPseudo<T>) & OtherKeys<T, unknown>;
