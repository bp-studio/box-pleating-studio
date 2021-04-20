
class Rasterizer {

	private readonly _display: Display;
	private readonly _img: HTMLImageElement;

	constructor(display: Display, img: HTMLImageElement) {
		this._display = display;
		this._img = img;

		window.addEventListener("beforeprint", this.$beforePrint.bind(this));
		window.addEventListener("afterprint", this._afterPrint.bind(this));
	}

	private _createPNG(): Promise<Blob> {
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
			setTimeout(() => URL.revokeObjectURL(old), 5000);

			this._img.src = this.$createSvgUrl();
			this._printing = true;
		}
	}

	public _afterPrint() {
		this._debounce = setTimeout(() => {
			this._printing = false;
			this._debounce = NaN;
		}, 1000);
	}

	public async $createPngUrl(): Promise<string> {
		const blob = await this._createPNG();
		return URL.createObjectURL(blob);
	}

	public async $copyPNG(): Promise<void> {
		const blob = await this._createPNG();
		return navigator.clipboard.write([
			new ClipboardItem({ 'image/png': blob })
		]);
	}

	/** 產生 SVG 檔案連結 */
	public $createSvgUrl(): string {
		let rect = this._display.$getBound();
		let svg = this._display.$project.exportSVG({
			bounds: rect,
			matrix: this._display.$project.view.matrix
		}) as SVGElement;
		if(!this._display.$settings.includeHiddenElement) this._removeHidden(svg);

		let blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
		return URL.createObjectURL(blob);
	}

	/** 遞迴移除所有具有 visibility="hidden" 屬性的標籤 */
	private _removeHidden(node: Element) {
		let children = Array.from(node.children);
		for(let c of children) {
			if(c.getAttribute('visibility') == 'hidden') node.removeChild(c);
			else this._removeHidden(c);
		}
	}
}
