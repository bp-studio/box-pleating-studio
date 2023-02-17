
import { shallowRef } from "vue";

type Setter<T> = (v: T) => boolean;

/** Make a field into {@link shallowRef} in Vue */
function shallowRefDecorator<T>(setter: Setter<T>): ClassFieldDecorator;
function shallowRefDecorator(value: undefined, context: ClassFieldDecoratorContext): ClassFieldInitializer;
function shallowRefDecorator(
	...p: [undefined, ClassFieldDecoratorContext] | [Setter<unknown>]
): ClassFieldDecorator | ClassFieldInitializer {
	if(p.length != 1) {
		return shallowRefDecoratorCore(...p);
	} else {
		return (value: undefined, context: ClassFieldDecoratorContext) =>
			shallowRefDecoratorCore(value, context, p[0]);
	}
}

function shallowRefDecoratorCore<T = unknown>(
	value: undefined,
	context: ClassFieldDecoratorContext,
	setter?: Setter<T>
): ClassFieldInitializer<T> {
	return function(this: object, initialValue: T) {
		const ref = shallowRef<T>();
		const set = setter ?
			(v: T) => setter(v) && (ref.value = v) :
			(v: T) => ref.value = v;
		Object.defineProperty(this, context.name, {
			configurable: false,
			set,
			get() { return ref.value; },
		});
		return initialValue; // This will trigger the set method above
	};
}

export { shallowRefDecorator as shallowRef };

type ClassFieldDecoratorContext = {
	kind: "field";
	name: string | symbol;
	static: boolean;
	private: boolean;
};

type ClassFieldInitializer<T = unknown> = (this: object, initialValue: T) => T;

type ClassFieldDecorator<T = unknown> =
	(value: undefined, context: ClassFieldDecoratorContext) => ClassFieldInitializer<T> | void;
