
type PseudoCore<T> =
	T extends (infer U)[] ? PseudoCore<U>[] :
	T extends object ? Pseudo<T> : T;

type Pseudo<T> = Record<Exclude<string, keyof T>, any> & {
	[key in keyof T]?: PseudoCore<T[key]>;
};

//////////////////////////////////////////////////////////////////
/**
 * `Migration` 負責處理不同版本的檔案格式的遷移，以求向下相容。
 */
//////////////////////////////////////////////////////////////////

namespace Migration {

	export const $current: string = "0.4";

	export function $getSample(): JDesign {
		return {
			title: "",
			version: Migration.$current,
			mode: "layout",
			layout: {
				sheet: { width: 16, height: 16 },
				flaps: [],
				stretches: [],
			},
			tree: {
				sheet: { width: 20, height: 20 },
				nodes: [],
				edges: []
			}
		};
	}

	export function $process(design: Pseudo<JDesign>, onDeprecated?: (title?: string) => void): JDesign {

		let deprecate = false;

		// beta 版把原本的 cp 模式改名為 layout 模式，以預留 cp 模式給未來使用
		// 同時從 beta 版開始加上檔案版本代碼
		if(!('version' in design)) {
			if(design.mode == "cp") design.mode = "layout";
			if(design.cp) {
				design.layout = design.cp;
				delete design.cp;
				if('stretches' in design.layout!) design.layout!.stretches = [];
			}
			design.version = "beta";
			deprecate = true;
		}

		// 從 rc0 版本開始要求 intersection 都必須加上 e
		if(design.version == "beta") {
			design.version = "rc0";
			let st = design.layout?.stretches;
			if(st) for(let s of st.concat()) {
				let cf = s.configuration;
				if(cf && (!cf.overlaps || cf.overlaps.some((o: JOverlap) =>
					o.c.some((c: JCorner) => c.type == CornerType.$intersection && c.e === undefined)
				))) {
					st.splice(st.indexOf(s), 1);
					deprecate = true;
				}
			}
		}

		// rc1 版本中在資料結構上插入了 partition 和 device 的層次
		if(design.version == "rc0") {
			design.version = "rc1";
			let st = design.layout?.stretches;
			if(st) for(let s of st.concat()) {
				let cf = s.configuration;
				if(cf) {
					s.configuration = {
						partitions: toPartition(cf.overlaps, cf.strategy)
					};
					let pt = s.pattern;
					if(pt) {
						let offsets = pt.offsets;
						// rc0 版本產生出來的 pattern 只有兩種可能：單一 Device，
						// 或是多個 Device 各自只有一個 Gadget
						if(cf.partitions!.length == 1) {
							s.pattern = {
								devices: [{
									gadgets: pt.gadgets,
									offset: offsets?.[0]
								}]
							};
						} else {
							s.pattern = {
								devices: pt.gadgets.map((g: JGadget, i: number) => ({
									gadgets: [g],
									offset: offsets?.[i]
								}))
							};
						}
					}
				}
			}
		}

		// 版本 0 與 rc1 完全相同，純粹為了紀念發行而改變號碼
		if(design.version == "rc1") design.version = "0";

		// 版本 0.4 完全向下相容於版本 0，並不需要作任何修改；所有不同的地方都會自動被忽略
		// 差別包括多了 history（不存檔）、棄用 fullscreen、scale 改成 zoom（不存檔）
		if(design.version == "0") design.version = "0.4";

		if(deprecate && onDeprecated) onDeprecated(design.title);
		return design as JDesign;
	}

	function toPartition(overlaps: JOverlap[], strategy?: Strategy): JPartition[] {
		let partitions: JOverlap[][] = [];
		let partitionMap = new Map<number, number>();
		for(let [i, o] of overlaps.entries()) {
			// 如果當前的這個已經被加入過了就跳過
			if(partitionMap.has(i)) continue;

			// 找出所有重合的錨點
			let coin = o.c.filter(c => c.type == CornerType.$coincide);

			let c = coin.find(c => partitionMap.has(-c.e! - 1));
			let j = partitions.length;

			if(c) {
				// 如果重合的之中有任何一個已經被加入過了，就把自己加入同一個分組
				let j = partitionMap.get(-c.e! - 1)!;
				partitionMap.set(i, j);
				partitions[j].push(o);
			} else {
				// 否則自己成為一個新分組的第一個成員
				partitionMap.set(i, j);
				partitions.push([o]);
			}

			// 把重合的之中所有還沒被加入的也加入到自己的分組之中
			coin.forEach(c => {
				i = -c.e! - 1;
				if(!partitionMap.has(i)) {
					partitionMap.set(i, j);
					partitions[j].push(overlaps[i]);
				}
			});
		}
		return partitions.map<JPartition>(p => ({ overlaps: p, strategy }));
	}
}
