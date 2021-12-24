
// 載入並啟動 paper.js
importScripts("./lib/paper-core.min.js");

const SheetSize = 128;

(function() {

	let scope = new paper.PaperScope();
	scope.setup([SheetSize, SheetSize]); // 這個尺寸隨便都可以，不影響使用
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
