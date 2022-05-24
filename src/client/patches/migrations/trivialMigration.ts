import type { JProject } from "shared/json";

/** 實際上沒有做任何事情的 {@link Migration} */
export default function $process(proj: Pseudo<JProject>): boolean {
	return false;
}
