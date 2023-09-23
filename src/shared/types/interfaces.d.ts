
/**
 * {@link ISerializable} is for objects that implements {@link toJSON} method for serialization.
 */
interface ISerializable<T> {

	/**
	 * Note that this method is intended to create a snapshot of the state of the object,
	 * so it shouldn't directly export any internal objects that might be modified later.
	 */
	toJSON(): T;
}
