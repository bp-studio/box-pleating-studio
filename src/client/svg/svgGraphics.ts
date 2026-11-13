import type { FillInput, SmoothGraphics, StrokeInput } from "pixi.js";

//=================================================================
/**
 * {@link SvgGraphics} creates SVG path syntax.
 * It is compatible to {@link SmoothGraphics} in method signatures.
 *
 * Like in Pixi v8, a path is first built and then filled or stroked.
 * The actual styles are given by the CSS classes, so only the stroke width
 * is taken from the styles.
 */
//=================================================================

export class SvgGraphics {

	/** Class names used by the next object. */
	private _class: string = "";

	/** Accumulated SVG string. */
	private _svg: string = "";

	/** The path that has been filled or stroked, which can still be cut. */
	private _committed: string = "";

	/** Stroke width setting of the committed path. */
	private _width: number | undefined = undefined;

	/** The path currently being built. */
	private _path: string = "";

	public $get(): string {
		this.$addPath();
		return this._svg;
	}

	/** Class names used by the next object. */
	public get $class(): string {
		return this._class;
	}
	public set $class(v: string) {
		this.$addPath();
		this._class = v;
	}

	/** Output all pending paths. */
	public $addPath(): void {
		this._outputCommitted();
		if(this._path) {
			this._svg += `<path class="${this._class}" d="${this._path}" />`;
			this._path = "";
		}
	}

	////////////////////////////////////////////////////////////////////////////
	// Drawing methods
	////////////////////////////////////////////////////////////////////////////

	public closePath(): this {
		this._path += "Z";
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

	public arcTo(
		x1: number, y1: number, x2: number, y2: number, radius: number
	): this {
		this._path += `A${radius},${radius},0,0,1,${x2},${y2}`;
		return this;
	}

	public rect(x: number, y: number, width: number, height: number): this {
		this.$addPath();
		this._svg += `<rect class="${this._class}" x="${x}" y="${y}" width="${width}" height="${height}" />`;
		return this;
	}

	public roundRect(
		x: number, y: number, width: number, height: number, radius: number
	): this {
		this.$addPath();
		this._svg += `<rect class="${this._class}" x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" />`;
		return this;
	}

	public circle(x: number, y: number, radius: number): this {
		this.$addPath();
		this._svg += `<circle class="${this._class}" cx="${x}" cy="${y}" r="${radius}" />`;
		return this;
	}

	public fill(style?: FillInput): this {
		this._commit();
		return this;
	}

	public stroke(style?: StrokeInput): this {
		this._commit();
		if(this._committed && typeof style == "object" && style && "width" in style) {
			this._width = style.width;
		}
		return this;
	}

	/** Cut the current path from the committed path, as in compound paths. */
	public cut(): this {
		this._committed += this._path;
		this._path = "";
		return this;
	}

	////////////////////////////////////////////////////////////////////////////
	// Stub methods
	////////////////////////////////////////////////////////////////////////////

	public clear(): this { return this; }

	////////////////////////////////////////////////////////////////////////////
	// Private methods
	////////////////////////////////////////////////////////////////////////////

	/**
	 * Commit the current path for filling or stroking.
	 * If the current path is empty, the committed path is reused
	 * (as in the case of filling and then stroking the same path).
	 */
	private _commit(): void {
		if(!this._path) return;
		this._outputCommitted();
		this._committed = this._path;
		this._path = "";
	}

	private _outputCommitted(): void {
		if(!this._committed) return;
		const style = this._width === undefined ? "" : ` style="stroke-width:${this._width}"`;
		this._svg += `<path class="${this._class}"${style} d="${this._committed}" />`;
		this._committed = "";
		this._width = undefined;
	}
}
