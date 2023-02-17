
//=================================================================
/**
 * {@link Task} represents a single updating task in the updating process.
 */
//=================================================================

export class Task {

	/** Used for deciding execution order. */
	public readonly $priority: number;

	/** What the task does. */
	public readonly $action: Action;

	/** Other tasks depending on self. */
	public readonly $dependant: readonly Task[];

	/**
	 * Note that the parameters are "the tasks depending on this task",
	 * rather than "the tasks on which this task depends".
	 *
	 * The reason for this counter-intuitive design is that,
	 * the importing mechanism of JavaScript will then automatically
	 * import the downstream modules. If we use the other approach,
	 * then we will have to import the last downstream module somewhere ourselves,
	 * which is even more inconvenient.
	 */
	constructor(action: Action, ...deps: Task[]) {
		this.$action = action;
		this.$priority = deps.length ? Math.max(...deps.map(d => d.$priority)) + 1 : 0;
		this.$dependant = deps;
	}
}
