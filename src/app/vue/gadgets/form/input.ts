import { getCurrentInstance, onMounted, shallowRef, watch } from "vue";

export function useFieldId(): string {
	return "field" + getCurrentInstance()?.uid;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useInput(
	props: { readonly modelValue: unknown },
	emit: Function
) {
	const value = shallowRef<unknown>();
	let focused = false;

	onMounted(() => {
		value.value = props.modelValue;

		watch(() => props.modelValue, v => {
			if(!focused) value.value = v;
		});
	});

	function blur(): void {
		value.value = props.modelValue;
		focused = false;
	}

	function focus(event: FocusEvent): void {
		focused = true;
		(event.target as HTMLInputElement).select();
	}

	function input(event: InputEvent): void {
		value.value = (event.target as HTMLInputElement).value;
		emit("update:modelValue", value.value);
	}

	return { blur, focus, input, value };
}
