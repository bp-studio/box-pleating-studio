
import type	Vue from "vue";

declare global {
	interface IShow extends Vue.ComponentPublicInstance {
		show(): void;
	}

	interface Executor extends Vue.ComponentPublicInstance {
		execute(): void;
	}
}
