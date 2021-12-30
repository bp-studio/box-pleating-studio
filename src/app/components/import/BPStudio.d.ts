import type { BPStudio } from "bp/BPStudio";

declare global {
	const bp: BPStudio;
}

export { BPStudio };
export { Control } from "bp/design/class";
export { Design, River, Edge, Flap, Vertex, Repository, Configuration } from "bp/design";
export { DisplaySetting } from "bp/env/screen";
