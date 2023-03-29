
// A type patch for the standard library.
// See https://github.com/microsoft/TypeScript/issues/38520
interface ObjectConstructor {
	keys<T>(o: T): (keyof T)[];
}
