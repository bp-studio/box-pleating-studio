import App from "@/app.vue";
import Core from "app/core";
import Lib from "app/services/libService";
import { plugin } from "app/services/languageService";

import "app/style/main.scss";

const TIME_TERMINATE = 100;

// 禁用預設滾輪縮放功能
document.addEventListener(
	"wheel",
	(event: WheelEvent) => {
		if(event.ctrlKey || event.metaKey) event.preventDefault();
	},
	{
		passive: false, // 明確指定以消除 console 警告
		capture: true, // 全域優先捕獲事件
	}
);

if(errMgr.ok()) {
	// 初始化 app
	const app = Vue.createSSRApp(App);
	if(plugin) app.use(plugin);

	async function init(): Promise<void> {
		try {
			app.mount("#app");
			await Core.init();

			// 載入所有非關鍵資源
			await Lib.load();
		} catch(e: unknown) {
			if(e instanceof Error) errMgr.runErr = e.toString();
		} finally {
			if(errMgr.callback()) { // 第二檢查點
				setTimeout(() => window.onunhandledrejection = null, TIME_TERMINATE);
			}
		}
	}
	init();
}

export { isTouch } from "app/shared/constants";
export { id, isDark } from "app/misc";
export { callWorker } from "app/utils/workerUtility";
export { default as settings } from "app/services/settingService";
