/* istanbul ignore file */

/**
 * Declare a field as non-enumerable.
 */
export function nonEnumerable(target: object, name: string): void;
export function nonEnumerable(target: object, name: string, desc: PropertyDescriptor): PropertyDescriptor;
export function nonEnumerable(
	target: object, name: string, desc?: PropertyDescriptor
): PropertyDescriptor | void {
	if(desc) {
		desc.enumerable = false;
		return desc;
	}
	// Define a non-enumerable field on prototype is of no use,
	// so we use the initializer-trick here.
	Object.defineProperty(target, name, {
		set(value) {
			Object.defineProperty(this, name, {
				value, writable: true, configurable: false,
			});
		},
		configurable: true,
	});
}
