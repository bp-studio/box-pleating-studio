import type { ILineStyleOptions, SmoothGraphics } from "@pixi/graphics-smooth";
import type { LINE_SCALE_MODE } from "@pixi/graphics-smooth/lib/core/LineStyle";

//=================================================================
/**
 * {@link SvgGraphics} creates SVG path syntax.
 * It is compatible to {@link SmoothGraphics} in method signatures.
 */
//=================================================================

export class SvgGraphics {

	/** Class names used by the next object. */
	public $class: string = "";

	/** Whether we are creating a compound path. */
	private _compoundMode: boolean = false;

	/** Stroke width setting. */
	private _width: number | undefined = undefined;

	/** Accumulated SVG string. */
	private _svg: string = "";

	/** Content of the current path. */
	private _path: string = "";

	public $get(): string {
		this.$addPath();
		return this._svg;
	}

	public $addPath(): void {
		if(this._path) {
			const style = this._width === undefined ? "" : ` style="stroke-width:${this._width}"`;
			this._svg += `<path class="${this.$class}"${style} d="${this._path}" />`;
			this._path = "";
			this._width = undefined;
			this._compoundMode = false;
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Drawing methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public closePath(): this {
		this._path += "Z";
		if(!this._compoundMode) this.$addPath();
		return this;
	}

	public moveTo(x: number, y: number): this {
		this._path += `M${x},${y}`;
		return this;
	}

	public lineTo(x: number, y: number): this {
		this._path += `L${x},${y}`;
		return this;
	}

	public drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): this {
		this.$addPath();
		this._svg += `<rect class="${this.$class}" x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" />`;
		return this;
	}

	public drawCircle(x: number, y: number, radius: number): this {
		this.$addPath();
		this._svg += `<circle class="${this.$class}" cx="${x}" cy="${y}" r="${radius}" />`;
		return this;
	}

	public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): this {
		this._path += `A${radius},${radius},0,0,1,${x2},${y2}`;
		return this;
	}

	/**
	 * We use the same signature as {@link SmoothGraphics} here.
	 */
	public lineStyle(options: ILineStyleOptions): this;
	public lineStyle(
		width: number, color?: number, alpha?: number,
		alignment?: number, scaleMode?: LINE_SCALE_MODE): this;
	public lineStyle(...args: [number, ...unknown[]] | [ILineStyleOptions]): this {
		if(typeof args[0] == "number") this._width = args[0];
		else this._width = args[0].width;
		return this;
	}

	public beginFill(color?: number, alpha?: number, smooth?: boolean): this {
		this.$addPath();
		this._compoundMode = true;
		return this;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Stub methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public clear(): this { return this; }
	public endFill(): this { return this; }
	public beginHole(): this { return this; }
	public endHole(): this { return this; }
}

// These methods are never used, so we don't actually implement them.
export interface SvgGraphics {
	drawRect(x: number, y: number, width: number, height: number): this;
}
