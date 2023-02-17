import type { JProject } from "shared/json";

/** A {@link Migration} that does nothing. */
export default function $process(proj: Pseudo<JProject>): boolean {
	return false;
}
