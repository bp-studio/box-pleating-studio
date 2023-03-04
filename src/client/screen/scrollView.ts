import { computed, watch } from "vue";

import ProjectService from "client/services/projectService";
import { useViewport } from "./viewport";

import type { Viewport } from "./viewport";
import type { ScrollController } from "client/controllers/scrollController";

/**
 * The global image size.
 *
 * Note that we don't setup a watcher for this value and call {@link ScrollView.$updateScrollbar} when it changes,
 * because as long as the label calculation logic is correct,
 * the size of the image is not supposed to have significant changes except for the case of zooming.
 */
const imageDimension = computed<IDimension>(() => {
	const sheet = ProjectService.sheet.value;
	if(!sheet) return { width: 0, height: 0 };
	return sheet.$imageDimension.value;
});

//=================================================================
/**
 * {@link ScrollView} manages the scrollable area, including whether to show the scrollbars,
 * the the low-level operations upon scrolling.
 * It doesn't include the UI logic of scrolling though;
 * that part is handled by {@link ScrollController}.
 */
//=================================================================

export class ScrollView extends EventTarget {

	public readonly $viewport: Viewport;
	public readonly $img: HTMLImageElement;
	private readonly _el: HTMLElement;
	private readonly _spaceHolder: HTMLDivElement;

	/** Lock the event feedback behavior when we scroll programmatically. */
	private _lock: boolean = false;

	constructor(el: HTMLElement) {
		super();
		this._el = el;
		this.$viewport = useViewport(el);

		// SpaceHolder
		this._spaceHolder = document.createElement("div");
		el.appendChild(this._spaceHolder);
		this._spaceHolder.style.zIndex = "-10"; // Fix issue in iPhone 6

		// Image for rasterizer
		this.$img = document.createElement("img");
		this.$img.alt = ""; // To silence LightHouse warnings
		this._spaceHolder.appendChild(this.$img);

		// Proactive scrolling by the user
		el.addEventListener("scroll", () => {
			if(this._lock) this._lock = false;
			else this.dispatchEvent(new Event("scroll"));
		});

		// Scroll area size change
		window.addEventListener("resize", () => this.$updateScrollbar());

		watch(() => app.settings.showStatus, () => this.$updateScrollbar());
	}

	public get $isScrollable(): boolean {
		return this._el.classList.contains("scroll-x") || this._el.classList.contains("scroll-y");
	}

	public $onScroll(handler: Consumer<IPoint>): void {
		this.addEventListener("scroll", () =>
			handler({ x: this._el.scrollLeft, y: this._el.scrollTop })
		);
	}

	/** Decide whether to show scrollbar. */
	public $updateScrollbar(): void {
		// First we update the size of the Viewport,
		// so that we can calculate the size of the image.
		this.$viewport.$update();

		const image = imageDimension.value;
		this._spaceHolder.style.width = image.width + "px";
		this._spaceHolder.style.height = image.height + "px";

		// Add 2 to avoid floating errors.
		const scrollX = image.width > this._el.clientWidth + 2;
		const scrollY = image.height > this._el.clientHeight + 2;
		this._el.classList.toggle("scroll-x", scrollX);
		this._el.classList.toggle("scroll-y", scrollY);

		// Double check, to handle the case where on scrollbar is needed only because of the other scrollbar.
		this._el.classList.toggle("scroll-x", scrollX || image.width > this._el.clientWidth + 2);
		this._el.classList.toggle("scroll-y", scrollY || image.height > this._el.clientHeight + 2);

		// The toggling of scrollbars could result in changes of the Viewport,
		// so we setup a delay and update it again.
		setTimeout(this.$viewport.$update, 0);
	}

	/** 檢查指定的捲動座標並且完成捲動，然後傳回修正後的捲動座標 */
	public $scrollTo(x: number, y: number): IPoint {
		const image = imageDimension.value;
		const w = Math.max(image.width - this._el.clientWidth, 0);
		const h = Math.max(image.height - this._el.clientHeight, 0);
		if(x < 0) x = 0;
		if(y < 0) y = 0;
		if(x > w) x = w;
		if(y > h) y = h;
		this._lock = true;
		this._el.scrollLeft = x;
		this._el.scrollTop = y;
		return { x, y };
	}
}
