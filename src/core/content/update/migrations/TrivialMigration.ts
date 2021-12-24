import type { JDesign } from "bp/content/json";

/** 實際上沒有做任何事情的 {@link Migration} */
export default function $process(design: Pseudo<JDesign>): boolean {
	return false;
}
