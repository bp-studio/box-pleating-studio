
/**
 * 類別 `T`（預設為未知）的建構式。
 */
type Constructor<T = unknown> = abstract new (...args: any[]) => T;

/**
 * 任何一個傳回型別為 `T` 的函數。
 */
type Action<T = void> = (...args: any[]) => T;

/**
 * 一個接受 `A`、傳回 `B` 的函數。
 */
type Func<A, B> = (a: A) => B;

/**
 * 一個接受 `A` 的函數。
 */
type Consumer<A> = Func<A, void>;

/**
 * 一個直接傳回 `T` 或者傳回 {@link Promise Promise}`<T>` 的函數。
 */
type Awaitable<T> = T | Promise<T>;

/**
 * 去除掉 `readonly` 的限制
 */
type Writeable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * 型別 `O` 當中、那些型別為 `T` 的屬性之名稱。
 */
type KeysOfType<O, T> = {
	[K in keyof O]: O[K] extends T ? K : never
}[keyof O];

// 這邊加上 undefined 是為了讓下層的屬性值自動相容於 RecursivePartial
type RecursivePartial<T> = { [P in keyof T]?: RecursivePartial<T[P]> } | undefined;

type PseudoValue<T> =
	T extends (infer U)[] ? PseudoValue<U>[] :
	T extends object ? Pseudo<T> : T;
type OtherKeys<T, V> = Record<Exclude<string, keyof T>, V>;
type PartialPseudo<T> = { [key in keyof T]?: PseudoValue<T[key]> };

/**
 * 表示是 {@link RecursivePartial} 之外、還有可能有一些舊格式當中殘留下來的屬性（其值均設定為 `unknown`）。
 */
type Pseudo<T> = (T | PartialPseudo<T>) & OtherKeys<T, unknown>;
