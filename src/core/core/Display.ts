
//////////////////////////////////////////////////////////////////
/**
 * `Display` 物件負責管理 Canvas 的基本設置以及跟 paper.js 之間的串接。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Display {

	/** 工作區域 viewport 的寬度 */
	@shrewd private _viewWidth: number;

	/** 工作區域 viewport 的高度 */
	@shrewd private _viewHeight: number;

	private readonly _studio: BPStudio;

	public readonly $project: paper.Project;
	public readonly $boundary: paper.Path;

	private readonly _MARGIN = 30;

	//private readonly DPI = devicePixelRatio ?? 1;

	/** 暫時鎖定 Viewport 大小 */
	private _lockViewport: boolean = false;

	// private _frameRateCount: number = 0;
	// private _frameRateTotal: number = 0;

	private _spaceHolder: HTMLDivElement;

	private _canvas: HTMLCanvasElement;

	/** @exports */
	@shrewd public settings: DisplaySetting = {
		showAxialParallel: true,
		showGrid: true,
		showHinge: true,
		showRidge: true,
		showLabel: true,
		showDot: true,
		includeHiddenElement: false,
	}

	constructor(studio: BPStudio) {
		this._studio = studio;

		// 加入一個填充空間、在 desktop 環境製造原生捲軸的 div
		studio.$el.appendChild(this._spaceHolder = document.createElement("div"));
		this._spaceHolder.style.zIndex = "-10"; // 修正 iPhone 6 的問題

		// 產生 <canvas>
		this._canvas = document.createElement("canvas");
		studio.$el.appendChild(this._canvas);
		window.addEventListener("resize", this._setSize.bind(this));
		this._setSize();

		// 重新刷新頁面的時候在手機版上可能會有一瞬間大小判斷錯誤，
		// 所以在建構的時候額外再多判斷一次
		setTimeout(() => this._setSize(), 10);

		window.addEventListener("beforeprint", this.beforePrint.bind(this));
		window.addEventListener("afterprint", this._afterPrint.bind(this));

		// 設置事件，在手機版鍵盤開啟時暫時鎖定
		let isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
		document.addEventListener("focusin", e => {
			if(isTouch && (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
				this._lockViewport = true;
			}
		});
		document.addEventListener("focusout", e => this._lockViewport = false);

		// 初始化 paper.js 設定
		studio.$paper.setup(this._canvas);
		studio.$paper.settings.insertItems = false;
		this.$project = studio.$paper.project;
		this.$project.view.autoUpdate = false;
		this.$project.currentStyle.strokeColor = PaperUtil.$Black();
		this.$project.currentStyle.strokeScaling = false;

		// 下面這段程式碼是用來檢視效能用的。
		/* this.project.view.onFrame = (event: any) => {
			this._frameRateCount++;
			this._frameRateTotal += event.delta;
			if(this._frameRateTotal > 0.5) {
				console.log((this._frameRateCount / this._frameRateTotal).toString());
				this._frameRateCount = 0;
				this._frameRateTotal = 0;
			}
		}; */

		// 建立圖層
		for(let l of Enum.values(Layer)) {
			this.$project.addLayer(new paper.Layer({ name: Layer[l] }));
		}

		// 設置圖層邊界遮罩
		this.$boundary = new paper.Path.Rectangle({
			from: [0, 0],
			to: [0, 0]
		});
		for(let l of Enum.values(Layer)) {
			if(LayerOptions[l].clipped) {
				this.$project.layers[l].addChild(this.$boundary.clone());
				this.$project.layers[l].clipped = true;
			}
		}
	}

	/** 視窗大小有變動的時候重設 canvas 大小 */
	private _setSize() {
		if(this._lockViewport) return;
		this._viewWidth = this._studio.$el.clientWidth;
		this._viewHeight = this._studio.$el.clientHeight;
	}

	/** 輸出 SVG 檔案 */
	/** @exports */
	public toSVG(): string {
		let cw = Math.max(this._sheetWidth, this._viewWidth);
		let ch = Math.max(this._sheetHeight, this._viewHeight);
		let x = (cw - this._sheetWidth) / 2 - this._scroll.x;
		let y = (ch - this._sheetHeight) / 2 - this._scroll.y;
		let rect = new paper.Rectangle(x, y, this._sheetWidth, this._sheetHeight);

		let svg = this._studio.$paper.project.exportSVG({
			bounds: rect,
			matrix: this.$project.view.matrix
		}) as SVGElement;
		if(!this.settings.includeHiddenElement) this._removeHidden(svg);

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

	@onDemand private get _img(): HTMLImageElement {
		let img = new Image();
		this._spaceHolder.appendChild(img);
		return img;
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
			this.beforePrint();
		});
	}

	/** @exports */
	public toPNG(): Promise<string> {
		return this._createPNG().then(blob => URL.createObjectURL(blob));
	}

	/** @exports */
	public copyPNG(): Promise<void> {
		return this._createPNG().then(blob =>
			navigator.clipboard.write([
				new ClipboardItem({ 'image/png': blob })
			])
		);
	}

	/** 用來偵測列印事件連續觸發；這個在手機上會發生 */
	private _printing: boolean = false;

	/** 手機連續觸發的情況中 afterPrint 也會被連續觸發，用這個偵測出最後一次 */
	private _debounce: number;

	/** @exports */
	public beforePrint() {
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

			this._img.src = this.toSVG();
			this._printing = true;
		}
	}

	private _afterPrint() {
		this._debounce = setTimeout(() => {
			this._printing = false;
			this._debounce = NaN;
		}, 1000);
	}

	private get _scroll(): IPoint {
		return this._studio.design?.sheet.$scroll ?? { x: 0, y: 0 };
	}

	@shrewd public get $scale() {
		if(this._studio.design) {
			let s = this.$getAutoScale(this._studio.design.sheet);
			return this._studio.design.sheet.zoom * s / 100;
		} else {
			return 100;
		}
	}

	@shrewd private get _horMargin(): number {
		return Math.max((this._studio.design?.sheet.$margin ?? 0) + 10, this._MARGIN);
	};

	@shrewd private get _sheetWidth(): number {
		return (this._studio.design?.sheet?.width ?? 0) * this.$scale + this._horMargin * 2;
	}

	@shrewd private get _sheetHeight(): number {
		return (this._studio.design?.sheet?.height ?? 0) * this.$scale + this._MARGIN * 2;
	}

	@shrewd public get $isXScrollable(): boolean {
		return this._sheetWidth > this._viewWidth + 1; // 加 1 以避免浮點數誤觸
	}

	@shrewd public get $isYScrollable(): boolean {
		return this._sheetHeight > this._viewHeight + 1; // 加 1 以避免浮點數誤觸
	}

	public $getAutoScale(sheet?: Sheet): number {
		sheet = sheet || this._studio.design?.sheet;
		let ws = (this._viewWidth - this._horMargin * 2) / (sheet?.width ?? 1);
		let hs = (this._viewHeight - this._MARGIN * 2) / (sheet?.height ?? 1);
		return Math.min(ws, hs);
	}

	/** 設置捲軸的顯示與否、並且傳回當前是否可捲動 */
	@shrewd public $isScrollable(): boolean {
		this._studio.$el.classList.toggle("scroll-x", this.$isXScrollable);
		this._studio.$el.classList.toggle("scroll-y", this.$isYScrollable);
		return this.$isXScrollable || this.$isYScrollable;
	}

	@shrewd private _renderSetting() {
		let notLayout = (this._studio.design?.mode != "layout" ?? false);
		this.$project.layers[Layer.$hinge].visible = this.settings.showHinge;
		this.$project.layers[Layer.$ridge].visible = this.settings.showRidge || notLayout;
		this.$project.layers[Layer.$axisParallels].visible = this.settings.showAxialParallel;
		this.$project.layers[Layer.$label].visible = this.settings.showLabel;
		this.$project.layers[Layer.$dot].visible = this.settings.showDot || notLayout;
	}

	@shrewd private _onSheetChange() {
		let sheet = this._studio.design?.sheet;
		if(sheet) {
			this._spaceHolder.style.width = this._totalWidth + "px";
			this._spaceHolder.style.height = this._totalHeight + "px";
			this._studio.system.scroll.to(sheet.$scroll.x, sheet.$scroll.y);
		}
	}

	@shrewd private get _totalWidth() { return Math.max(this._sheetWidth, this._viewWidth); }
	@shrewd private get _totalHeight() { return Math.max(this._sheetHeight, this._viewHeight); }

	@shrewd private get _margin(): IPoint {
		let tw = this._totalWidth, th = this._totalHeight;
		let mw = (tw - this._sheetWidth) / 2 + this._horMargin, mh = (th + this._sheetHeight) / 2 - this._MARGIN;
		return { x: mw - this._scroll.x, y: mh - this._scroll.y };
	}

	public $zoom(zoom: number, sheet: Sheet, center?: IPoint) {
		if(zoom < 100) zoom = 100;
		if(!sheet || sheet.zoom == zoom) return;

		if(center) {
			let rect = this._studio.$el.getBoundingClientRect();
			center.x -= rect.left;
			center.y -= rect.top;
		} else {
			center = { x: this._viewWidth / 2, y: this._viewHeight / 2 };
		}

		let m = this._margin, s = this.$scale;
		let cx = (center.x - m.x) / s, cy = (m.y - center.y) / s;

		sheet.mZoom = zoom; // 執行完這行之後，再次存取 this.scale 和 this.margin 會發生改變
		m = this._margin;
		s = this.$scale;

		this.$scrollTo(
			sheet.$scroll.x + cx * s + m.x - center.x,
			sheet.$scroll.y + m.y - cy * s - center.y
		);
	}

	public $scrollTo(x: number, y: number) {
		let sheet = this._studio.design!.sheet;
		let w = this._totalWidth - this._viewWidth;
		let h = this._totalHeight - this._viewHeight;
		if(x < 0) x = 0;
		if(y < 0) y = 0;
		if(x > w) x = w;
		if(y > h) y = h;
		sheet.$scroll.x = Math.round(x);
		sheet.$scroll.y = Math.round(y);
	}

	@shrewd public $render() {
		let width = 0, height = 0, s = this.$scale;

		// 取得基本的數值
		if(this._studio.design && this._studio.design.sheet) {
			({ width, height } = this._studio.design.sheet);
		}

		// 更新目前的邊界繪製
		// TODO：未來這一段應該要轉移到 Sheet 物件上頭
		PaperUtil.$setRectangleSize(this.$boundary, width, height);

		// 配置 Paper.js 的 View 的大小
		let el = this._studio.$el;
		let { x, y } = this._margin;
		let [w, h] = [this._viewWidth, this._viewHeight]; // 不管怎樣都要建立相依性以保證重新繪製
		this.$isScrollable(); // 順序上必須先把捲軸設定完成、clientWidth/Height 才會是正確的值
		if(this._lockViewport) this.$project.view.viewSize.set(w, h);
		else this.$project.view.viewSize.set(el.clientWidth, el.clientHeight);

		// 配置變換矩陣
		this.$project.view.matrix.set(s, 0, 0, -s, x, y);

		// 設定各個圖層的邊界和變換矩陣
		for(let l of Enum.values(Layer)) {
			let layer = this.$project.layers[l];
			if(LayerOptions[l].clipped) {
				(layer.children[0] as paper.Path).set({
					segments: this.$boundary.segments
				});
			}
			if(!LayerOptions[l].scaled) {
				layer.applyMatrix = false;
				layer.matrix.set(1 / s, 0, 0, -1 / s, 0, 0);
			}
		}
	}
}

interface DisplaySetting {
	showGrid: boolean;
	showHinge: boolean;
	showRidge: boolean;
	showAxialParallel: boolean;
	showLabel: boolean;
	showDot: boolean;
	includeHiddenElement: boolean;
}
