
//////////////////////////////////////////////////////////////////
/**
 * `Display` 物件負責管理 Canvas 的基本設置以及跟 paper.js 之間的串接。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Display {

	/** 工作區域 viewport 的寬度 */
	@shrewd private viewWidth: number;

	/** 工作區域 viewport 的高度 */
	@shrewd private viewHeight: number;

	private readonly _studio: BPStudio;

	public readonly project: paper.Project;
	public readonly boundary: paper.Path;

	private readonly MARGIN = 30;

	/** 暫時鎖定 Viewport 大小 */
	private lockViewport: boolean = false;

	private _frameRateCount: number = 0;
	private _frameRateTotal: number = 0;

	private spaceHolder: HTMLDivElement;

	private _canvas: HTMLCanvasElement;

	private _img: HTMLImageElement;

	@shrewd private scroll: IPoint = { x: 0, y: 0 };

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
		studio.$el.appendChild(this.spaceHolder = document.createElement("div"));
		studio.$el.addEventListener("scroll", this.onScroll.bind(this));

		// 產生 <canvas>
		this._canvas = document.createElement("canvas");
		studio.$el.appendChild(this._canvas);
		window.addEventListener("resize", this.setSize.bind(this));
		this.setSize();

		// 產生列印用的 <img>
		this.spaceHolder.appendChild(this._img = new Image());
		window.addEventListener("beforeprint", this.beforePrint.bind(this));
		window.addEventListener("afterprint", this.afterPrint.bind(this));

		// 設置事件，在手機版鍵盤開啟時暫時鎖定
		let mobile = matchMedia("(hover: none)").matches;
		document.addEventListener("focusin", e => {
			if(mobile && (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
				this.lockViewport = true;
			}
		});
		document.addEventListener("focusout", e => this.lockViewport = false);

		// 初始化 paper.js 設定
		studio.$paper.setup(this._canvas);
		studio.$paper.settings.insertItems = false;
		this.project = studio.$paper.project;
		this.project.currentStyle.strokeColor = PaperUtil.Black;
		this.project.currentStyle.strokeScaling = false;

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
			this.project.addLayer(new paper.Layer({ name: Layer[l] }));
		}

		// 設置圖層邊界遮罩
		this.boundary = new paper.Path.Rectangle({
			from: [0, 0],
			to: [0, 0]
		});
		for(let l of Enum.values(Layer)) {
			if(LayerOptions[l].clipped) {
				this.project.layers[l].addChild(this.boundary.clone());
				this.project.layers[l].clipped = true;
			}
		}
	}

	/** 視窗大小有變動的時候重設 canvas 大小 */
	private setSize() {
		if(this.lockViewport) return;
		this.viewWidth = this._studio.$el.clientWidth;
		this.viewHeight = this._studio.$el.clientHeight;
	}

	/** 輸出 SVG 檔案 */
	public toSVG(): string {
		let cw = Math.max(this.sheetWidth, this.viewWidth);
		let ch = Math.max(this.sheetHeight, this.viewHeight);
		let x = (cw - this.sheetWidth) / 2 - this.scroll.x;
		let y = (ch - this.sheetHeight) / 2 - this.scroll.y;
		let rect = new paper.Rectangle(x, y, this.sheetWidth, this.sheetHeight);

		let svg = this._studio.$paper.project.exportSVG({
			bounds: rect,
			matrix: this.project.view.matrix
		}) as SVGElement;
		if(!this.settings.includeHiddenElement) this.removeHidden(svg);

		let blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
		return URL.createObjectURL(blob);
	}

	/** 遞迴移除所有具有 visibility="hidden" 屬性的標籤 */
	private removeHidden(node: Element) {
		let children = Array.from(node.children);
		for(let c of children) {
			if(c.getAttribute('visibility') == 'hidden') node.removeChild(c);
			else this.removeHidden(c);
		}
	}

	private createPNG(): Promise<Blob> {
		let canvas = document.createElement("canvas");
		let ctx = canvas.getContext("2d")!;
		let img = this._img;
		return new Promise<Blob>(resolve => {
			let callback = () => {
				img.removeEventListener("load", callback);
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
			};
			img.addEventListener("load", callback);
			this.beforePrint();
		});
	}

	public toPNG(): Promise<string> {
		return this.createPNG().then(blob => URL.createObjectURL(blob));
	}

	public copyPNG(): Promise<void> {
		return this.createPNG().then(blob =>
			navigator.clipboard.write([
				new ClipboardItem({ 'image/png': blob })
			])
		);
	}

	/** 用來偵測列印事件連續觸發；這個在手機上會發生 */
	private _printing: boolean = false;

	/** 手機連續觸發的情況中 afterPrint 也會被連續觸發，用這個偵測出最後一次 */
	private _debounce: number;

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

	private afterPrint() {
		this._debounce = setTimeout(() => {
			this._printing = false;
			this._debounce = NaN;
		}, 1000);
	}

	private onScroll(): void {
		this.scroll.x = this._studio.$el.scrollLeft;
		this.scroll.y = this._studio.$el.scrollTop;
	}

	@shrewd public get scale() {
		if(this._studio.design && this._studio.design.sheet) {
			if(this._studio.design.fullscreen) {
				let ws = (this.viewWidth - this.MARGIN * 2) / this._studio.design.sheet.width;
				let wh = (this.viewHeight - this.MARGIN * 2) / this._studio.design.sheet.height;
				return Math.min(ws, wh);
			} else {
				return this._studio.design.sheet.scale;
			}
		} else {
			return 1;
		}
	}

	@shrewd private get sheetWidth(): number {
		return (this._studio.design?.sheet?.width ?? 0) * this.scale + this.MARGIN * 2;
	}

	@shrewd private get sheetHeight(): number {
		return (this._studio.design?.sheet?.height ?? 0) * this.scale + this.MARGIN * 2;
	}

	@shrewd public get isXScrollable(): boolean {
		return this.sheetWidth > this.viewWidth;
	}

	@shrewd public get isYScrollable(): boolean {
		return this.sheetHeight > this.viewHeight;
	}

	public getAutoScale(): number {
		let ws = (this.viewWidth - this.MARGIN * 2) / (this._studio.design?.sheet?.width ?? 1);
		let hs = (this.viewHeight - this.MARGIN * 2) / (this._studio.design?.sheet?.height ?? 1);
		return Math.min(ws, hs);
	}

	@shrewd public isScrollable(): boolean {
		this._studio.$el.classList.toggle("scroll-x", this.isXScrollable);
		this._studio.$el.classList.toggle("scroll-y", this.isYScrollable);
		return this.isXScrollable || this.isYScrollable;
	}

	@shrewd private renderSetting() {
		let notLayout = (this._studio.design?.mode != "layout" ?? false);
		this.project.layers[Layer.hinge].visible = this.settings.showHinge;
		this.project.layers[Layer.ridge].visible = this.settings.showRidge || notLayout;
		this.project.layers[Layer.axisParallel].visible = this.settings.showAxialParallel;
		this.project.layers[Layer.label].visible = this.settings.showLabel;
		this.project.layers[Layer.dot].visible = this.settings.showDot || notLayout;
	}

	@shrewd public render() {
		let width = 0, height = 0, s = this.scale;

		// 取得基本的數值
		if(this._studio.design && this._studio.design.sheet) {
			({ width, height } = this._studio.design.sheet);
		}
		let cw = Math.max(this.sheetWidth, this.viewWidth);
		let ch = Math.max(this.sheetHeight, this.viewHeight);
		this.spaceHolder.style.width = cw + "px";
		this.spaceHolder.style.height = ch + "px";

		// 更新目前的邊界繪製
		// TODO：未來這一段應該要轉移到 Sheet 物件上頭
		PaperUtil.setRectangleSize(this.boundary, width, height);

		// 依照數值配置 Paper.js 的 View 的大小和變換矩陣
		let el = this._studio.$el;
		let mw = (cw - this.sheetWidth) / 2 + this.MARGIN, mh = (ch + this.sheetHeight) / 2 - this.MARGIN;

		if(this.lockViewport) this.project.view.viewSize.set(this.viewWidth, this.viewHeight);
		else this.project.view.viewSize.set(el.clientWidth, el.clientHeight);

		this.project.view.matrix.set(s, 0, 0, -s, mw - this.scroll.x, mh - this.scroll.y);

		// 設定各個圖層的邊界和變換矩陣
		for(let l of Enum.values(Layer)) {
			let layer = this.project.layers[l];
			if(LayerOptions[l].clipped) {
				(layer.children[0] as paper.Path).set({
					segments: this.boundary.segments
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
