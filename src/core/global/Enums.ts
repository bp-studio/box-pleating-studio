
//////////////////////////////////////////////////////////////////
// Enums
//////////////////////////////////////////////////////////////////

type Enum<E> = Record<keyof E, number | string> & { [k: number]: string };

namespace Enum {
	export function values<E extends Enum<E>>(e: E): (E[keyof E])[] {
		return Object
			.values<number>(e as Record<string, number>)
			.filter(a => !isNaN(Number(a))) as (E[keyof E])[];
	}
}

enum Direction { UR, UL, LL, LR, R, T, L, B, none }

enum Layer { $sheet, $shade, $hinge, $ridge, $axisParallels, $junction, $dot, $label, $drag }

/** 角落的連接型態 */
enum CornerType {
	/** 被其它 Overlap 內部連入 */
	$socket,
	/** 內部連出到另一個 Overlap */
	$internal,
	/** 側角，也是連至脊線交點，不過由於位於最側邊的關係，在產生河道輪廓的時候可以無限延伸 */
	$side,
	/** 連至脊線交點的角；此時 e 指的是參與交點的另一個 Flap 的 id */
	$intersection,
	/** 連至 Flap 的角 */
	$flap,
	/** 這個角和另外一個 Overlap 的角落是重合的；這會使得當前的 Overlap 和對方屬於相同的 Partition */
	$coincide
};

interface ILayerOptions {
	clipped: boolean;
	scaled: boolean;
}

const LayerOptions: { [key: number]: ILayerOptions } = {
	[Layer.$sheet]: { clipped: false, scaled: true },
	[Layer.$shade]: { clipped: true, scaled: true },
	[Layer.$hinge]: { clipped: true, scaled: true },
	[Layer.$ridge]: { clipped: true, scaled: true },
	[Layer.$axisParallels]: { clipped: true, scaled: true },
	[Layer.$junction]: { clipped: true, scaled: true },
	[Layer.$dot]: { clipped: false, scaled: false },
	[Layer.$label]: { clipped: false, scaled: false },
	[Layer.$drag]: { clipped: false, scaled: true },
};
