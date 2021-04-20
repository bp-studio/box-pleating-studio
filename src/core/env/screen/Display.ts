
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

	public readonly $project: paper.Project;
	public readonly $boundary: paper.Path;

	public $rasterizer: Rasterizer;

	//private readonly DPI = devicePixelRatio ?? 1;

	// private _frameRateCount: number = 0;
	// private _frameRateTotal: number = 0;
	private readonly _studio: Studio;

	private _canvas: HTMLCanvasElement;
	private _viewport: Viewport;
	private _workspace: Workspace;

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

		// 產生 <canvas>
		this._canvas = document.createElement("canvas");
		studio.$el.appendChild(this._canvas);
		this._viewport = new Viewport(studio.$el);

		// 建構 Workspace
		this._workspace = new Workspace(studio, this._viewport);

		// 設定 rasterizer
		this.$rasterizer = new Rasterizer(this, this._workspace.$createImg());

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
	public $getBound(): paper.Rectangle {
		return this._workspace.$getBound();
	}

	public $zoom(zoom: number, relativeCenter?: IPoint) {
		// 檢查
		if(zoom < 100) zoom = 100;
		let sheet = this._studio.$design?.sheet;
		if(!sheet || sheet.zoom == zoom) return;

		// 計算絕對座標下的中心點
		let absoluteCenter: IPoint;
		if(relativeCenter) {
			let rect = this._studio.$el.getBoundingClientRect();
			absoluteCenter = { x: relativeCenter.x - rect.left, y: relativeCenter.y - rect.top };
		} else {
			absoluteCenter = { x: this._viewport.$width / 2, y: this._viewport.$height / 2 };
		}

		// 呼叫工作區域去進行縮放
		this._workspace.$zoom(zoom, absoluteCenter);
	}

	@shrewd private _renderSetting() {
		let notLayout = (this._studio.$design?.mode != "layout" ?? false);
		this.$project.layers[Layer.$hinge].visible = this.$settings.showHinge;
		this.$project.layers[Layer.$ridge].visible = this.$settings.showRidge || notLayout;
		this.$project.layers[Layer.$axisParallels].visible = this.$settings.showAxialParallel;
		this.$project.layers[Layer.$label].visible = this.$settings.showLabel;
		this.$project.layers[Layer.$dot].visible = this.$settings.showDot || notLayout;
	}

	@shrewd public get $isXScrollable(): boolean {
		return this._workspace.$image.$width > this._viewport.$width + 1; // 加 1 以避免浮點數誤觸
	}

	@shrewd public get $isYScrollable(): boolean {
		return this._workspace.$image.$height > this._viewport.$height + 1; // 加 1 以避免浮點數誤觸
	}

	/** 設置捲軸的顯示與否、並且傳回當前是否可捲動 */
	@shrewd public $isScrollable(): boolean {
		this._studio.$el.classList.toggle("scroll-x", this.$isXScrollable);
		this._studio.$el.classList.toggle("scroll-y", this.$isYScrollable);
		return this.$isXScrollable || this.$isYScrollable;
	}

	public get $scale() {
		return this._workspace.$image.$scale;
	}

	public $scrollTo(x: number, y: number) {
		this._workspace.$scrollTo(x, y);
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
		this._viewport.$setup(this, this.$project.view.viewSize);

		// 配置變換矩陣
		let { x, y } = this._workspace.$offset;
		this.$project.view.matrix.set(scale, 0, 0, -scale, x, y);

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
				layer.matrix.set(1 / scale, 0, 0, -1 / scale, 0, 0);
			}
		}
	}
}
