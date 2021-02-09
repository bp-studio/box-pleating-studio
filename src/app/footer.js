
var i18n = new VueI18n({
	locale: 'en',
	fallbackLocale: 'en',
	silentFallbackWarn: true,
	messages: locale
});
const core = new Vue.options.components['core']({ i18n });
core.$mount('#core');
var app = new Vue.options.components['app']({ i18n });
app.$mount('#app');

// 避免 core 被某些第三方套件覆寫
Object.defineProperty(window, "core", {
	get: () => core,
	set: v => { }
});

var bp;
window.addEventListener("DOMContentLoaded", () => {
	// 製造執行緒的斷點，讓 Android PWA 偵測到以結束 splash screen
	setTimeout(async () => {
		await core.initReady;
		bp = new BPStudio("#divWorkspace");
		bp.system.onLongPress = () => app.showPanel = true;
		bp.system.onDrag = () => app.showPanel = false;
		core.init();
	}, 10);
});
