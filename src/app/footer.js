/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable dot-notation */
/* eslint-disable new-cap */
/* eslint-disable no-var */
/* eslint-disable vars-on-top */
/* eslint-disable no-undef */

function loadLibrary() {
	let loading = [];

	// CSS
	loading.push(loadStylesheet('lib/font-awesome/css/all.min.css'));

	// 程式庫
	let libs = [
		'sortable.min.js',
		'vuedraggable.umd.min.js',
		'bootstrap/popper.min.js',
		'bootstrap/bootstrap.min.js',
		'vue-clipboard.min.js',
		'jszip.min.js',
		'marked.min.js',
	];
	for(let lib of libs) loading.push(loadScript('lib/' + lib));

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

var bp;
var libReady = new Promise(resolve => {
	window.addEventListener("DOMContentLoaded", () => {
		// 製造執行緒的斷點，讓 Android PWA 偵測到以結束 splash screen
		setTimeout(async () => {
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
					resolve();
				} else {
					// 底下這兩列失敗也無所謂，上面 callback() 已經做完了
					core.$destroy();
					app.$destroy();
				}
			}
		}, 10);
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
var app = new Vue.options.components['app']({ i18n });
app.$mount('#app');

// 避免 core 被某些第三方套件覆寫
Object.defineProperty(window, "core", {
	get: () => core,
	set: v => { /* */ },
});
