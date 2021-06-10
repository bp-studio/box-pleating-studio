
class Rasterizer {

	private static readonly _DEBOUNCE = 1000;
	private static readonly _GC_TIME = 5000;

	private readonly _display: Display;
	private readonly _img: HTMLImageElement;

	constructor(display: Display, img: HTMLImageElement) {
		this._display = display;
		this._img = img;

		window.addEventListener("beforeprint", this.$beforePrint.bind(this));
		window.addEventListener("afterprint", this._afterPrint.bind(this));
	}

	public $createPngBlob(): Promise<Blob> {
		let canvas = document.createElement("canvas");
		let ctx = canvas.getContext("2d")!;
		let img = this._img;
		return new Promise<Blob>(resolve => {
			img.addEventListener("load", () => {
				canvas.width = img.clientWidth;
				canvas.height = img.clientHeight;
				// 繪製一層白色背景
				ctx.fillStyle = 'white';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				// 把 img 的影像內容縮放繪製到 canvas 上；img 的最大大小是透過 CSS 指定的
				ctx.drawImage(img,
					0, 0, img.naturalWidth, img.naturalHeight,
					0, 0, img.clientWidth, img.clientHeight
				);
				this._printing = false;
				canvas.toBlob(blob => resolve(blob!));
			}, { once: true });
			this.$beforePrint();
		});
	}

	/** 用來偵測列印事件連續觸發；這個在手機上會發生 */
	private _printing: boolean = false;

	/** 手機連續觸發的情況中 afterPrint 也會被連續觸發，用這個偵測出最後一次 */
	private _debounce: number;

	public $beforePrint() {
		clearTimeout(this._debounce);
		if(!this._printing &&
			// 手機上如果列印對話方塊中重新設定樣式，beforePrint 會再次觸發，
			// 但可以用下面的條件來排除這個情況
			document.visibilityState == 'visible'
		) {
			let old = this._img.src;

			// 一直到下一次要產生新的圖片時才回收掉上次產生的 ObjectURL，
			// 而且設置了一個很大的延遲，這是為了解決在手機上透過外部服務列印時可能發生的延遲
			setTimeout(() => URL.revokeObjectURL(old), Rasterizer._GC_TIME);

			this._img.src = URL.createObjectURL(this._display.$createSvgBlob());
			this._printing = true;
		}
	}

	public _afterPrint() {
		this._debounce = window.setTimeout(() => {
			this._printing = false;
			this._debounce = NaN;
		}, Rasterizer._DEBOUNCE);
	}

	public async $copyPNG(): Promise<void> {
		const blob = await this.$createPngBlob();
		return navigator.clipboard.write([
			new ClipboardItem({ 'image/png': blob }),
		]);
	}
}
