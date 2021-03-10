
//////////////////////////////////////////////////////////////////
/**
 * 因為曲線區域的交集這種運算很花時間，為了增進效能，
 * 這邊採用 Web Worker 來開多執行緒運算。
 */
//////////////////////////////////////////////////////////////////

namespace PaperWorker {

	export function done() {
		return running;
	}

	const master = new Worker("./paper-master.js");

	type Payload = [paper.Item, number];

	let running = Promise.resolve();
	let end: Action | null = null;
	let count = 0;

	export async function processJunction(shade: paper.CompoundPath, j: string[]): Promise<void> {
		if(!end) running = new Promise(res => end = res);
		count++;
		if(j.length == 2) {
			let [i, a] = await getIntersection(j[0], j[1]);
			shade.removeChildren();
			shade.addChild(i);
			shade.strokeWidth = widthForArea(a);
		} else {
			let [r1, r2] = await Promise.all([
				getIntersection(j[0], j[3]),
				getIntersection(j[1], j[2])
			])
			let [i1, a1] = r1, [i2, a2] = r2;
			shade.removeChildren();
			shade.addChild(i1);
			shade.addChild(i2);
			shade.strokeWidth = widthForArea(a1 + a2);
		}
		if(--count == 0) {
			end!();
			end = null;
		}
	}

	function getIntersection(s1: string, s2: string): Promise<Payload> {
		return new Promise<Payload>(resolve => {
			let channel = new MessageChannel();
			channel.port1.onmessage = event => {
				let [json, area] = event.data;
				let item = new paper.Path();
				item.importJSON(json);
				resolve([item, area]);
			}
			master.postMessage([s1, s2], [channel.port2]);
		});
	}

	/** 當相交面積太小的時候加粗框線以免重疊不明顯 */
	function widthForArea(a: number): number {
		return a < 0.25 ? 4 : a < 0.5 ? 3 : a < 1 ? 2 : 1;
	}
}
