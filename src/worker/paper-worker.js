
// 這個檔案不用 TypeScript 寫，因為缺乏適合的定義檔

// 載入並啟動 paper.js
importScripts("paper-core.min.js")
paper.install(this);
paper.setup([128, 128]); // 這個尺寸隨便都可以，不影響使用

console.log(project);

// 關掉自動更新，因為實際上這個 Worker 完全沒有要進行繪製
project.view.autoUpdate = false;

onmessage = function(event) {
	if(event.ports[0]) {
		let [j1, j2] = event.data;

		// 把傳入的資料還原成物件
		let i1 = project.importJSON(j1);
		let i2 = project.importJSON(j2);

		// 計算交集
		let result = i1.intersect(i2);

		// 傳回資料和面積（在這邊先計算好以節省主執行緒的計算量）
		let data = [result.exportJSON(), result.area];
		event.ports[0].postMessage(data);
	}
};
