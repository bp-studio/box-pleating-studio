var i18n = new VueI18n({
	locale: 'en',
	fallbackLocale: 'en',
	silentFallbackWarn: true,
	messages: locale
});
var core = new Vue.options.components['core']({ i18n });
core.$mount('#core');
var app = new Vue.options.components['app']({ i18n });
app.$mount('#app');

let url = new URL(location.href);
let lz = url.searchParams.get("project"), json;
if(lz) {
	try {
		json = JSON.parse(LZ.decompress(lz));
		// 動態 SEO
		if(json.description) document.querySelector("meta[name=description]").content = json.description;
	} catch(e) { }
}
if(lz != sessionStorage.getItem("project") && json) {
	// 寫入 sessionStorage 的值不會因為頁籤 reload 而遺失，
	// 因此可以用這個來避免重刷頁面的時候再次載入的問題
	sessionStorage.setItem("project", lz);
	core.addDesign(bp.load(json));
}

document.addEventListener("wheel", function(event) {
	if(event.ctrlKey) event.preventDefault();
}, { passive: false });
