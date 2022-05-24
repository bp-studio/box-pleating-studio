
/**
 * 定義所有的圖層以及它們的順序。
 */
export enum Layer {
	/** 紙邊與格線 */
	$sheet,
	/** 選取的陰影效果 */
	$shade,
	/** 樹狀邊 */
	$edge,
	/** 樞紐線 */
	$hinge,
	/** 脊線 */
	$ridge,
	/** 軸平行線 */
	$axisParallels,
	/** 衝突顯示 */
	$junction,
	/** 角片頂點 */
	$dot,
	/** 節點 */
	$vertex,
	/** 文字標籤 */
	$label,
}

export interface ILayerOptions {
	/** 這個圖層是否要沿著紙張邊緣剪裁，預設值為 `false` */
	clipped?: boolean;

	/** 這個圖層上的物件是否可以互動，預設值為 `false` */
	interactive?: boolean;
}

/**
 * 各個圖層的設定值。
 */
export const LayerOptions: Record<Layer, ILayerOptions> = {
	[Layer.$sheet]: {},
	[Layer.$shade]: { clipped: true, interactive: true },
	[Layer.$edge]: { clipped: true, interactive: true },
	[Layer.$hinge]: { clipped: true },
	[Layer.$ridge]: { clipped: true },
	[Layer.$axisParallels]: { clipped: true },
	[Layer.$junction]: { clipped: true },
	[Layer.$dot]: {},
	[Layer.$vertex]: { interactive: true },
	[Layer.$label]: {},
};
