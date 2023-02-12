import { State } from "core/service/state";
import { Task } from "./task";

//=================================================================
/**
 * {@link patternTask} 負責尋找出可能的組態。
 */
//=================================================================
export const patternTask = new Task(pattern);

function pattern(): void {
	for(const repo of State.$newRepositories.values()) repo.$init();
}
