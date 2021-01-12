
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

Object.defineProperty(window, "core", {
	get: () => core,
	set: v => { }
});

var bp;
window.addEventListener("DOMContentLoaded", () => {
	bp = new BPStudio("#divWorkspace");
	bp.system.onLongPress = () => app.showPanel = true;
	bp.system.onDrag = () => app.showPanel = false;

	// 製造執行緒的斷點，讓 Android PWA 偵測到以結束 splash screen
	setTimeout(() => core.init(), 10);
});
