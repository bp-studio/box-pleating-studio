
export type DirectionKey = "up" | "down" | "left" | "right";

/**
 * 比較器是廣義用來決定全序的函數。
 *
 * 它傳回正值表示 `a > b`，負值表示 `a < b`，零值表示 `a == b`。
 */
export type Comparator<T> = (a: T, b: T) => number;
