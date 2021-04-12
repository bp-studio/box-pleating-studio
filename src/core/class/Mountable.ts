
//////////////////////////////////////////////////////////////////
/**
 * `Mountable` 是可掛載元件。「掛載」是指載入到當前的 `Studio` 的動作。
 */
//////////////////////////////////////////////////////////////////

abstract class Mountable extends Disposable {

	protected readonly $mountTarget: Mountable | BPStudio;

	private _oldStudio: BPStudio | null = null;

	constructor(parent: Mountable | BPStudio) {
		super();
		this.$mountTarget = parent;
	}

	protected get $shouldDispose(): boolean {
		return super.$shouldDispose ||
			(this.$mountTarget instanceof Mountable ? this.$mountTarget.$disposed : false);
	}

	@shrewd protected get $studio(): BPStudio | null {
		if(this.$disposed || !this.$isActive) return null;
		else if(!(this.$mountTarget instanceof Mountable)) return this.$mountTarget;
		else return this.$mountTarget.$studio;
	}

	/** 事件觸發反應方法 */
	@shrewd public $mountEvents() {
		this.$disposeEvent();
		if(this.$studio !== this._oldStudio) {
			if(this.$studio) this.$onMount(this.$studio);
			if(this._oldStudio) this.$onDismount(this._oldStudio);
			this._oldStudio = this.$studio;
		}
	}

	protected $onDispose() {
		if(this._oldStudio) this.$onDismount(this._oldStudio);
		super.$onDispose();
		// 雖然有 GC 上的風險，但是這邊我們不能把 this.mountTarget 刪除掉，
		// 不然的話在關閉的瞬間會有很多 DesignObject 出現參照上的錯誤
	}

	/**
	 * 傳回目前這個 `Mountable` 是否為「活躍」，亦即除了其父元件是否有被掛載之外，它自己是否應該要被掛載。
	 *
	 * 預設行為是傳回恆真（亦即其掛載與否永遠和父元件同步），但子元件可以覆寫這個行為，
	 * 而覆寫的行為通常是根據「父元件是否在某種意義上選取了自己」來決定。
	 */
	protected get $isActive() { return true; }

	public static $isActive(m: Mountable) { return m.$isActive; }

	/** 掛載事件 */
	protected $onMount(studio: BPStudio) { }

	/** 卸載事件 */
	protected $onDismount(studio: BPStudio) { }
}
