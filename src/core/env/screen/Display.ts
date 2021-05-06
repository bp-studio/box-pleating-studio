
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
 *
 * 這個物件有好幾個繼承層次，這是為了一方面顧及封裝和關注點分離、
 * 另一方面又便於這些層次之間的計算屬性共用。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Display extends Workspace {

	public readonly $boundary: paper.Path;

	public $rasterizer: Rasterizer;

	//private readonly DPI = devicePixelRatio ?? 1;

	// private _frameRateCount: number = 0;
	// private _frameRateTotal: number = 0;

	private readonly _project: paper.Project;

	private _canvas: HTMLCanvasElement;

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
		super(studio);

		// 產生 <canvas>
		this._canvas = document.createElement("canvas");
		this._el.appendChild(this._canvas);

		this.$rasterizer = new Rasterizer(this, this._createImg());

		// 初始化 paper.js 設定
		studio.$paper.setup(this._canvas);
		studio.$paper.settings.insertItems = false;
		this._project = studio.$paper.project;
		this._project.view.autoUpdate = false;
		this._project.currentStyle.strokeColor = PaperUtil.$Black();
		this._project.currentStyle.strokeScaling = false;

		// 下面這段程式碼是用來檢視效能用的。
		/* this.project.view.onFrame = (event: Event) => {
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
			this._project.addLayer(new paper.Layer({ name: Layer[l] }));
		}

		// 設置圖層邊界遮罩
		this.$boundary = new paper.Path.Rectangle({
			from: [0, 0],
			to: [0, 0]
		});
		for(let l of Enum.values(Layer)) {
			if(LayerOptions[l].clipped) {
				this.$addToLayer(this.$boundary.clone(), l);
				this._project.layers[l].clipped = true;
			}
		}
	}

	public $zoom(zoom: number, relativeCenter?: IPoint) {
		// 檢查
		if(zoom < 100) zoom = 100;
		let sheet = this._design?.sheet;
		if(!sheet || sheet.zoom == zoom) return;

		// 計算絕對座標下的中心點
		let absoluteCenter: IPoint;
		if(relativeCenter) {
			let rect = this._el.getBoundingClientRect();
			absoluteCenter = { x: relativeCenter.x - rect.left, y: relativeCenter.y - rect.top };
		} else {
			absoluteCenter = { x: this._viewWidth / 2, y: this._viewHeight / 2 };
		}

		// 呼叫工作區域去進行縮放
		super.$zoom(zoom, absoluteCenter);
	}

	/** 刷新繪製 */
	public $update() {
		this._project.view.update();
	}

	public $addToLayer(item: paper.Item, layer: Layer) {
		this._project.layers[layer].addChild(item);
	}

	@shrewd private _renderSetting() {
		let notLayout = (this._studio.$design?.mode != "layout" ?? false);
		this._project.layers[Layer.$hinge].visible = this.$settings.showHinge;
		this._project.layers[Layer.$ridge].visible = this.$settings.showRidge || notLayout;
		this._project.layers[Layer.$axisParallels].visible = this.$settings.showAxialParallel;
		this._project.layers[Layer.$label].visible = this.$settings.showLabel;
		this._project.layers[Layer.$dot].visible = this.$settings.showDot || notLayout;
	}

	@shrewd public get $isXScrollable(): boolean {
		return this._imgWidth > this._viewWidth + 1; // 加 1 以避免浮點數誤觸
	}

	@shrewd public get $isYScrollable(): boolean {
		return this._imgHeight > this._viewHeight + 1; // 加 1 以避免浮點數誤觸
	}

	/** 設置捲軸的顯示與否、並且傳回當前是否可捲動 */
	@shrewd public $isScrollable(): boolean {
		this._studio.$el.classList.toggle("scroll-x", this.$isXScrollable);
		this._studio.$el.classList.toggle("scroll-y", this.$isYScrollable);
		return this.$isXScrollable || this.$isYScrollable;
	}

	@shrewd public $render() {
		let width = 0, height = 0, scale = this.$scale;

		// 取得基本的數值
		if(this._studio.$design && this._studio.$design.sheet) {
			({ width, height } = this._studio.$design.sheet);
		}

		// 更新目前的邊界繪製
		// TODO：未來這一段應該要轉移到 Sheet 物件上頭
		PaperUtil.$setRectangleSize(this.$boundary, width, height);

		// 配置顯示區域大小
		this.$isScrollable(); // 順序上必須先把捲軸設定完成、clientWidth/Height 才會是正確的值
		this._setupViewport(this._project.view.viewSize);

		// 配置變換矩陣
		let { x, y } = this._offset;
		this._project.view.matrix.set(scale, 0, 0, -scale, x, y);

		// 設定各個圖層的邊界和變換矩陣
		for(let l of Enum.values(Layer)) {
			let layer = this._project.layers[l];
			if(LayerOptions[l].clipped) {
				(layer.children[0] as paper.Path).set({
					segments: this.$boundary.segments
				});
			}
			if(!LayerOptions[l].scaled) {
				layer.applyMatrix = false;
				layer.matrix.set(1 / scale, 0, 0, -1 / scale, 0, 0);
			}
		}
	}

	/** 產生 SVG 檔案連結 */
	public $createSvgUrl(): string {
		let rect = this._getBound();
		let svg = this._project.exportSVG({
			bounds: rect,
			matrix: this._project.view.matrix
		}) as SVGElement;
		if(!this.$settings.includeHiddenElement) this._removeHidden(svg);

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
