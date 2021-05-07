
//////////////////////////////////////////////////////////////////
// interfaces
//////////////////////////////////////////////////////////////////

/**
 * `IPoint` 介面是抽象化的二維點，不包含任何內部實作。
 */
interface IPoint {
	x: number;
	y: number;
}

/**
 * ISerializable 表示一個可以具有 toJSON 方法、可以輸出對應類別的 JSON 物件的類別
 */
interface ISerializable<T> {
	toJSON(): T;
}
