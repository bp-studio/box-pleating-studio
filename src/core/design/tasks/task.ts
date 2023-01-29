
//=================================================================
/**
 * {@link Task} 是執行週期當中的單位工作。
 */
//=================================================================

export class Task {

	/** 工作的層級，用來決定執行順序 */
	public readonly $priority: number;

	/** 這個工作的內容 */
	public readonly $action: Action;

	/** 相依於這個工作的其它工作 */
	public readonly $dependant: readonly Task[];

	/**
	 * 注意傳入的參數是「相依於這個工作的其它工作」，而非「這個工作所相依的工作」。
	 *
	 * 會這樣看似違反直覺的故意設計之理由在於，
	 * 如此一來 JavaScript 模組的相互引用會自動把所有下游的模組引入進來；
	 * 如果改採用後者的設計，那麼就需要另外設法把最下游的工作在某個地方引入，
	 * 這反而不方便。
	 */
	constructor(action: Action, ...deps: Task[]) {
		this.$action = action;
		this.$priority = deps.length ? Math.max(...deps.map(d => d.$priority)) + 1 : 0;
		this.$dependant = deps;
	}
}
