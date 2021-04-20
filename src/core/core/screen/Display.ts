
interface DisplaySetting {
	showGrid: boolean;
	showHinge: boolean;
	showRidge: boolean;
	showAxialParallel: boolean;
	showLabel: boolean;
	showDot: boolean;
	includeHiddenElement: boolean;
}

//////////////////////////////////////////////////////////////////
/**
 * `Display` 物件負責管理 Canvas 的基本設置以及跟 paper.js 之間的串接。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Display {

	private readonly _studio: Studio;

	public readonly $project: paper.Project;
	public readonly $boundary: paper.Path;

	private readonly _MARGIN = 30;

	//private readonly DPI = devicePixelRatio ?? 1;

	// private _frameRateCount: number = 0;
	// private _frameRateTotal: number = 0;

	private _spaceHolder: HTMLDivElement;

	private _canvas: HTMLCanvasElement;

	public $rasterizer: Rasterizer;

	private _viewport: Viewport;

	@shrewd public $settings: DisplaySetting = {
		showAxialParallel: true,
		showGrid: true,
		showHinge: true,
		showRidge: true,
		showLabel: true,
		showDot: true,
		includeHiddenElement: false,
	}

	constructor(studio: Studio) {
		this._studio = studio;

		// 加入一個填充空間、在 desktop 環境製造原生捲軸的 div
		studio.$el.appendChild(this._spaceHolder = document.createElement("div"));
		this._spaceHolder.style.zIndex = "-10"; // 修正 iPhone 6 的問題

		// 產生 <canvas>
		this._canvas = document.createElement("canvas");
		studio.$el.appendChild(this._canvas);
		this._viewport = new Viewport(studio.$el);

		// 設定 rasterizer
		let img = new Image();
		this._spaceHolder.appendChild(img);
		this.$rasterizer = new Rasterizer(this, img);

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

	/** 傳回全部（包括超出視界範圍的）要輸出的範圍 */
	public $getCompleteBound(): paper.Rectangle {
		let cw = Math.max(this._sheetWidth, this._viewport.$width);
		let ch = Math.max(this._sheetHeight, this._viewport.$height);
		let x = (cw - this._sheetWidth) / 2 - this._scroll.x;
		let y = (ch - this._sheetHeight) / 2 - this._scroll.y;
		return new paper.Rectangle(x, y, this._sheetWidth, this._sheetHeight);
	}

	private get _scroll(): IPoint {
		return this._studio.$design?.sheet.$scroll ?? { x: 0, y: 0 };
	}

	@shrewd public get $scale() {
		if(this._studio.$design) {
			let s = this._getAutoScale(this._studio.$design.sheet);
			return this._studio.$design.sheet.zoom * s / 100;
		} else {
			return 100;
		}
	}

	@shrewd private get _horMargin(): number {
		return Math.max((this._studio.$design?.sheet.$margin ?? 0) + 10, this._MARGIN);
	};

	@shrewd private get _sheetWidth(): number {
		return (this._studio.$design?.sheet?.width ?? 0) * this.$scale + this._horMargin * 2;
	}

	@shrewd private get _sheetHeight(): number {
		return (this._studio.$design?.sheet?.height ?? 0) * this.$scale + this._MARGIN * 2;
	}

	@shrewd public get $isXScrollable(): boolean {
		return this._sheetWidth > this._viewport.$width + 1; // 加 1 以避免浮點數誤觸
	}

	@shrewd public get $isYScrollable(): boolean {
		return this._sheetHeight > this._viewport.$height + 1; // 加 1 以避免浮點數誤觸
	}

	private _getAutoScale(sheet?: Sheet): number {
		sheet = sheet || this._studio.$design?.sheet;
		let ws = (this._viewport.$width - this._horMargin * 2) / (sheet?.width ?? 1);
		let hs = (this._viewport.$height - this._MARGIN * 2) / (sheet?.height ?? 1);
		return Math.min(ws, hs);
	}

	/** 設置捲軸的顯示與否、並且傳回當前是否可捲動 */
	@shrewd public $isScrollable(): boolean {
		this._studio.$el.classList.toggle("scroll-x", this.$isXScrollable);
		this._studio.$el.classList.toggle("scroll-y", this.$isYScrollable);
		return this.$isXScrollable || this.$isYScrollable;
	}

	@shrewd private _renderSetting() {
		let notLayout = (this._studio.$design?.mode != "layout" ?? false);
		this.$project.layers[Layer.$hinge].visible = this.$settings.showHinge;
		this.$project.layers[Layer.$ridge].visible = this.$settings.showRidge || notLayout;
		this.$project.layers[Layer.$axisParallels].visible = this.$settings.showAxialParallel;
		this.$project.layers[Layer.$label].visible = this.$settings.showLabel;
		this.$project.layers[Layer.$dot].visible = this.$settings.showDot || notLayout;
	}

	@shrewd private _onSheetChange() {
		let sheet = this._studio.$design?.sheet;
		if(sheet) {
			this._spaceHolder.style.width = this._totalWidth + "px";
			this._spaceHolder.style.height = this._totalHeight + "px";
			this._studio.$system.$scroll.to(sheet.$scroll.x, sheet.$scroll.y);
		}
	}

	@shrewd private get _totalWidth() { return Math.max(this._sheetWidth, this._viewport.$width); }
	@shrewd private get _totalHeight() { return Math.max(this._sheetHeight, this._viewport.$height); }

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
			center = { x: this._viewport.$width / 2, y: this._viewport.$height / 2 };
		}

		let m = this._margin, s = this.$scale;
		let cx = (center.x - m.x) / s, cy = (m.y - center.y) / s;

		sheet._zoom = zoom; // 執行完這行之後，再次存取 this.scale 和 this.margin 會發生改變
		m = this._margin;
		s = this.$scale;

		this.$scrollTo(
			sheet.$scroll.x + cx * s + m.x - center.x,
			sheet.$scroll.y + m.y - cy * s - center.y
		);
	}

	public $scrollTo(x: number, y: number) {
		let sheet = this._studio.$design!.sheet;
		let w = this._totalWidth - this._viewport.$width;
		let h = this._totalHeight - this._viewport.$height;
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
		if(this._studio.$design && this._studio.$design.sheet) {
			({ width, height } = this._studio.$design.sheet);
		}

		// 更新目前的邊界繪製
		// TODO：未來這一段應該要轉移到 Sheet 物件上頭
		PaperUtil.$setRectangleSize(this.$boundary, width, height);

		// 配置 Paper.js 的 View 的大小
		let { x, y } = this._margin;
		this.$isScrollable(); // 順序上必須先把捲軸設定完成、clientWidth/Height 才會是正確的值
		this._viewport.$setup(this.$project.view.viewSize);

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
