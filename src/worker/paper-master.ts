
/// <reference path="../core/global/paper.d.ts" />

if(typeof (Worker) == "undefined") {

	// 舊版的 Safari 沒辦法在 Worker 裡面開 Worker，所以 master 得自己負責同樣的工作
	(function() {

		// 載入並啟動 paper.js
		importScripts("paper-core.min.js");

		let scope = new paper.PaperScope();
		scope.setup([128, 128]); // 這個尺寸隨便都可以，不影響使用
		let project = scope.project;

		// 關掉自動更新，因為實際上這個 Worker 完全沒有要進行繪製
		project.view.autoUpdate = false;

		onmessage = function(event: MessageEvent) {
			if(event.ports[0]) {
				let [j1, j2] = event.data;

				// 把傳入的資料還原成物件
				let i1 = project.importJSON(j1) as paper.PathItem;
				let i2 = project.importJSON(j2) as paper.PathItem;

				// 計算交集
				let result = i1.intersect(i2) as paper.Path;

				// 傳回資料和面積（在這邊先計算好以節省主執行緒的計算量）
				let data = [result.exportJSON(), result.area];
				event.ports[0].postMessage(data);
			}
		};

	})();

} else {

	(function() {

		/** 所有開啟的 worker */
		const workers: Worker[] = [];

		/** 各個 worker 是否正在執行 */
		const working: boolean[] = [];

		/** 佇列的 Promise resolver */
		const queue: Function[] = [];

		// 盡量開啟到 CPU 數 - 2 那麼多個 worker，但總之至少開一個（否則根本不能跑）
		const max = Math.max((navigator.hardwareConcurrency ?? 4) - 2, 1);
		for(let i = 0; i < max; i++) {
			workers.push(new Worker("./paper-worker.js"));
			working.push(false);
		}

		/** 取得下一個可用的 worker 的 id */
		function getNextId(): number | Promise<number> {
			let id = working.findIndex(p => !p);
			if(id >= 0) {
				working[id] = true; // 傳回之前要先佔據 id
				return id;
			} else {
				return new Promise<number>(resolve => queue.push(resolve));
			}
		}

		onmessage = async function(event) {
			if(event.ports[0]) {
				let id = await getNextId();
				let channel = new MessageChannel();
				channel.port1.onmessage = ev => {
					// 直接接力傳回結果
					event.ports[0].postMessage(ev.data);

					// 如果有佇列工作就通知它來接手，不然就空出 id
					if(queue.length) queue.shift()(id);
					else working[id] = false;
				}
				workers[id].postMessage(event.data, [channel.port2]);
			}
		};

	})();

}
