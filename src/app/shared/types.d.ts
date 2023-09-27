
import type { ComponentPublicInstance } from "vue";

declare global {
	interface IShow extends ComponentPublicInstance {
		show(): void;
	}

	interface Executor extends ComponentPublicInstance {
		execute(): void;
	}
}
