import type { Project } from "client/project/project";

interface ITagObject {
	readonly $tag: string;
	readonly $project: Project;
}
