/* istanbul ignore file: legacy migration */
import type { JProject, JLayout } from "shared/json";

/**
 * Version beta renamed "cp" mode to "layout" mode,
 * so that "cp" mode could be used in the future.
 * Also version code is included since version beta.
 */
export default function $process(proj: Pseudo<JProject>): boolean {
	if(proj.mode == "cp") proj.mode = "layout";
	if(proj.cp) {
		const layout = proj.cp as JLayout;
		delete proj.cp;
		if("stretches" in layout) layout.stretches = [];
		proj.layout = layout;
	}
	return true;
}
