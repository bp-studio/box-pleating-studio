
/** rc1 版本中在資料結構上插入了 {@link Partition} 和 {@link Device} 的層次 */
namespace Rc1Migration {

	export function $process(design: Pseudo<JDesign>): boolean {
		let st = design.layout?.stretches as Pseudo<JStretch>[];
		if(st) {
			for(let s of st.concat()) {
				let cf = s.configuration as Pseudo<JConfiguration>;
				if(cf) pattern(cf, s);
			}
		}
		return false;
	}

	function pattern(cf: Pseudo<JConfiguration>, s: Pseudo<JStretch>): void {
		s.configuration = {
			partitions: partition(cf.overlaps as JOverlap[], cf.strategy as Strategy),
		};
		let pt = s.pattern as Pseudo<JPattern>;
		if(pt) {
			let offsets = pt.offsets as number[] | undefined;
			// rc0 版本產生出來的 pattern 只有兩種可能：單一 Device，
			// 或是多個 Device 各自只有一個 Gadget
			if(s.configuration.partitions!.length == 1) {
				s.pattern = {
					devices: [{
						gadgets: pt.gadgets as JGadget[],
						offset: offsets?.[0],
					}],
				};
			} else {
				s.pattern = {
					devices: (pt.gadgets as JGadget[]).map((g: JGadget, i: number) => ({
						gadgets: [g],
						offset: offsets?.[i],
					})),
				};
			}
		}
	}

	function cornerFilter(c: JCorner): boolean {
		return c.type == CornerType.$coincide;
	}

	function partition(overlaps: JOverlap[], strategy?: Strategy): JPartition[] {
		let partitions: JOverlap[][] = [];
		let partitionMap = new Map<number, number>();

		for(let [i, o] of overlaps.entries()) {
			// 如果當前的這個已經被加入過了就跳過
			if(partitionMap.has(i)) continue;

			// 找出所有重合的錨點
			let coins = o.c.filter(cornerFilter);

			let coin = coins.find(c => partitionMap.has(-c.e! - 1));
			let j = partitions.length;

			if(coin) {
				// 如果重合的之中有任何一個已經被加入過了，就把自己加入同一個分組
				let k = partitionMap.get(-coin.e! - 1)!;
				partitionMap.set(i, k);
				partitions[k].push(o);
			} else {
				// 否則自己成為一個新分組的第一個成員
				partitionMap.set(i, j);
				partitions.push([o]);
			}

			// 把重合的之中所有還沒被加入的也加入到自己的分組之中
			coins.forEach(c => {
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
