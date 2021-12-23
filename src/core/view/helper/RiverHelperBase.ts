import { QuadrantHelper } from "./QuadrantHelper";
import { PathUtil } from "bp/math";
import { makePerQuadrant, shrewdStatic } from "bp/global";
import { Disposable } from "bp/class";
import type { Path, PolyBool } from "bp/math";
import type { Flap } from "bp/design";
import type { View } from "../classes";

//////////////////////////////////////////////////////////////////
/**
 * {@link RiverHelperBase} 是輔助輪廓管理的類別。
 */
//////////////////////////////////////////////////////////////////

@shrewd export class RiverHelperBase extends Disposable {

	public readonly $flap: Flap;
	protected readonly _view: View;
	protected readonly _quadrants: readonly QuadrantHelper[];

	constructor(view: View, flap: Flap) {
		super(view);
		this._view = view;
		this.$flap = flap;
		this._quadrants = makePerQuadrant(q => new QuadrantHelper(this, q));
	}

	protected get $shouldDispose(): boolean {
		return super.$shouldDispose || this.$flap.$disposed;
	}

	public get $distance(): number {
		return 0;
	}

	@shrewdStatic // 已經透過 q.contour 來把關
	public get $shape(): PolyBool.Shape {
		this.$disposeEvent();
		let path: Path = [];
		this._quadrants.forEach(q => path.push(...q.$contour));
		return PathUtil.$toSegments(path);
	}
}
