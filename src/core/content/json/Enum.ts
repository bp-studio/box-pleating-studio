export enum Strategy {
	$halfIntegral = "HALFINTEGRAL",
	$universal = "UNIVERSAL",
	$baseJoin = "BASE_JOIN",
	$standardJoin = "STANDARD_JOIN",
	$perfect = "PERFECT",
}

export enum CommandType {
	field = 0,
	move = 1,
	add = 2,
	remove = 3,
}

/** 角落的連接型態 */
export enum CornerType {
	/** 被其它 Overlap 內部連入 */
	$socket,
	/** 內部連出到另一個 Overlap */
	$internal,
	/** 側角，也是連至脊線交點，不過由於位於最側邊的關係，在產生河道輪廓的時候可以無限延伸 */
	$side,
	/** 連至脊線交點的角；此時 e 指的是參與交點的另一個 {@link Flap} 的 id */
	$intersection,
	/** 連至 {@link Flap} 的角 */
	$flap,
	/** 這個角和另外一個 Overlap 的角落是重合的；這會使得當前的 Overlap 和對方屬於相同的 {@link Partition} */
	$coincide,
}
