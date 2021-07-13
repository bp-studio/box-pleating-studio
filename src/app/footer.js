/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable dot-notation */
/* eslint-disable new-cap */
/* eslint-disable no-var */
/* eslint-disable vars-on-top */
/* eslint-disable no-undef */

function loadLibrary() {
	let loading = [];
	for(let lib of libs) {
		if(lib.endsWith('js')) loading.push(loadScript(lib));
		else loading.push(loadStylesheet(lib));
	}
	return Promise.all(loading).then(results => results.every(result => result == true));
}

function loadStylesheet(href) {
	return new Promise(resolve => {
		let link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = href;
		link.onload = () => resolve(true);
		link.onerror = () => resolve(false);
		document.head.appendChild(link);
	});
}

function loadScript(src) {
	return new Promise(resolve => {
		let script = document.createElement('script');
		script.src = src;
		script.async = false;
		script.onload = () => resolve(true);
		script.onerror = () => resolve(false);
		document.head.appendChild(script);
	});
}

function sleep(t) {
	return new Promise(resolve => { setTimeout(resolve, t); });
}

var bp;
var libReady = new Promise(resolve => {
	window.addEventListener("DOMContentLoaded", async () => {
		// 初始化 app
		app = new Vue.options.components['app']({ i18n });
		app.$mount('#app');

		// 製造執行緒的斷點，讓 Android PWA 偵測到以結束 splash screen
		await sleep(10);

		try {
			await core.initReady;
			bp = new BPStudio("#divWorkspace");
			bp.option.onLongPress = () => app.showPanel = true;
			bp.option.onDrag = () => app.showPanel = false;
			core.init();

			// 載入所有非關鍵資源
			errMgr.resErr = !await loadLibrary();
		} catch(e) {
			errMgr.runErr = e.toString();
		} finally {
			if(errMgr.callback()) { // 第二檢查點
				setTimeout(() => window.onunhandledrejection = null, 100);
				resolve();
			} else {
				// 底下這兩列失敗也無所謂，上面 callback() 已經做完了
				core.$destroy();
				app.$destroy();
			}
		}
	}, { once: true });
});

var i18n = new VueI18n({
	locale: 'en',
	fallbackLocale: 'en',
	silentFallbackWarn: true,
	messages: locale,
});
const core = new Vue.options.components['core']({ i18n });
core.$mount('#core');

// app 的初始化延遲到 DOMContentLoaded 再執行，
// 以便在訪客初次造訪的時候可以最快速達成 LCP
var app;

// 避免 core 被某些第三方套件覆寫
Object.defineProperty(window, "core", {
	get: () => core,
	set: v => { /* */ },
});
