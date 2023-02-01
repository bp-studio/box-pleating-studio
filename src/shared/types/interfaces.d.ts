
interface ISerializable<T> {
	toJSON(): T;
}


interface IAsyncSerializable<T> {
	toJSON(): Promise<T>;
}
