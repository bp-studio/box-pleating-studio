
//=================================================================
/**
 * {@link Task} 是執行週期當中的單位工作。
 */
//=================================================================

export class Task {

	/** 工作的層級，用來決定執行順序 */
	public readonly $level: number;

	/** 這個工作的內容 */
	public readonly $action: Action;

	/** 相依於這個工作的其它工作 */
	public readonly $dependant: readonly Task[] = [];

	constructor(action: Action, ...deps: Task[]) {
		this.$action = action;
		this.$level = deps.length ? Math.max(...deps.map(d => d.$level)) + 1 : 0;
		deps.forEach(d => (d.$dependant as Task[]).push(this));
	}
}
