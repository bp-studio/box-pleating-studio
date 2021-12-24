//////////////////////////////////////////////////////////////////
// Injected constants
//////////////////////////////////////////////////////////////////

/**
 * 接受診斷模式，這個常數的實際值會由 Terser 注入；
 * 目前的設定是 DEV 版為 false，PUB 版為 true。
 */
declare const DEBUG_ENABLED: boolean;

//////////////////////////////////////////////////////////////////
// Utility types
//////////////////////////////////////////////////////////////////

type Action<T = void> = () => T;

type PseudoValue<T> =
	T extends (infer U)[] ? PseudoValue<U>[] :
	T extends object ? Pseudo<T> : T;
type OtherKeys<T, V> = Record<Exclude<string, keyof T>, V>;
type PartialPseudo<T> = { [key in keyof T]?: PseudoValue<T[key]> };
type Pseudo<T> = (T | PartialPseudo<T>) & OtherKeys<T, unknown>;

type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>;
} | undefined;

type constructor<T extends object> = new (...args: unknown[]) => T;

type Func<A, B> = (a: A) => B;

type Predicate<A, B> = (a: A, b: B) => boolean;

type IterableFactory<K> = () => Iterable<K>;

//////////////////////////////////////////////////////////////////
// interfaces
//////////////////////////////////////////////////////////////////

/**
 * {@link ISerializable} 表示一個可以具有 {@link ISerializable.toJSON toJSON()} 方法、可以輸出對應類別的 JSON 物件的類別
 */
interface ISerializable<T> {
	toJSON(): T;
}
