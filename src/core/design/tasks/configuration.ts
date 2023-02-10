import { State } from "core/service/state";
import { Task } from "./task";

//=================================================================
/**
 * {@link configurationTask} 負責尋找出可能的組態。
 */
//=================================================================
export const configurationTask = new Task(configuration);

function configuration(): void {
	for(const repo of State.$newRepositories.values()) repo.$init();
}
