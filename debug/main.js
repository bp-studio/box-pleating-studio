if(!err&&!wErr) { 
if(typeof (TextDecoder) == "undefined") throw new Error("TextDecoder is needed");

document.addEventListener("wheel", function(event) {
	if(event.ctrlKey) event.preventDefault();
}, { passive: false });

// 這邊宣告成 const 或 let 會在 Safari 中出錯，底下其它變數亦同
var isMac = navigator.platform.toLowerCase().startsWith("mac");

///////////////////////////////////////////////////
// 檔案處理
///////////////////////////////////////////////////

function sanitize(filename) {
	let c = '/\\:*|"<>'.split(''), r = "∕∖∶∗∣″‹›".split('');
	for(let i in c) filename = filename.replace(RegExp("\\" + c[i], "g"), r[i])
	return filename
		.replace(/\?/g, "ʔ̣")
		.replace(/\s+/g, " ")
		.replace(/[\x00-\x1f\x80-\x9f]/g, "")
		.replace(/^\.*$/, "project")
		.replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, "project")
		.replace(/[\. ]+$/, "project");
}

function readFile(file) {
	return new Promise((resolve, reject) => {
		let reader = new FileReader();
		reader.onload = e => resolve(e.target.result);
		reader.onerror = e => reject(e);
		reader.readAsArrayBuffer(file); // readAsText 可能無法完整讀取 binary 檔案
	});
}
function bufferToText(buffer) {
	return new TextDecoder().decode(new Uint8Array(buffer));
}

///////////////////////////////////////////////////
// Service Worker 溝通
///////////////////////////////////////////////////

function callService(data) {
	return new Promise((resolve, reject) => {
		if('serviceWorker' in navigator) {
			navigator.serviceWorker.getRegistration('/').then(reg => {
				if(!reg.active) return reject(); // Safari 在第一次執行的時候可能會進到這裡
				let channel = new MessageChannel();
				channel.port1.onmessage = event => resolve(event.data);
				reg.active.postMessage(data, [channel.port2]);
			}, () => reject());
		} else reject();
	});
}
if('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', event => {
	if(event.data == "id") event.ports[0].postMessage(core.id);
});

///////////////////////////////////////////////////
// LZMA
///////////////////////////////////////////////////

var LZ = {
	compress(s) {
		s = LZMA.compress(s, 1); // Experiments showed that 1 is good enough
		s = btoa(String.fromCharCode.apply(null, Uint8Array.from(s)));
		return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+/g, ""); // urlBase64
	},
	decompress(s) {
		// There's no need to add padding "=" back since atob() can infer it.
		s = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
		const bytes = new Uint8Array(s.length);
		for(let i = 0; i < bytes.length; i++) bytes[i] = s.charCodeAt(i);
		return LZMA.decompress(bytes);
	}
}

///////////////////////////////////////////////////
// 快捷鍵註冊
///////////////////////////////////////////////////

var hotkeys = [];

function registerHotkey(action, key, shift) {
	hotkeys.push([action, key.toLowerCase(), !!shift]);
}

document.body.addEventListener("keydown", e => {
	// 如果正在使用輸入框，不處理一切後續
	let active = document.activeElement;
	if(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
	if(e.metaKey || e.ctrlKey) {
		e.preventDefault();
		for(let [action, key, shift] of hotkeys) {
			if(e.key.toLowerCase() == key && e.shiftKey == shift) {
				action();
				return;
			}
		}
	}
})

const BaseComponent = { computed: { design() { return core.design; }, selections() { return core.selections; }, selection() { return this.selections[0]; } } };

const Dialog = { data() { return { modal: undefined, promise: null, message: undefined }; }, methods: { async show(message) {
            await core.libReady;
            while (this.promise)
                await this.promise;
            this.message = message;
            return await (this.promise = this.run());
        }, run() {
            let p = new Promise(resolve => this.resolve((v) => {
                this.promise = null;
                resolve(v);
            }));
            this.modal.show();
            return p;
        } }, mounted() {
        core.libReady.then(() => this.modal = new bootstrap.Modal(this.$el, { backdrop: 'static' }));
    } };

const InputMixin = { data() { return { id: "field" + this._uid, v: null, focused: false }; }, props: { value: null }, watch: { 'value'(v) { if (!this.focused)
            this.v = v; } }, methods: { blur() {
            this.v = this.value;
            this.focused = false;
        }, focus(event) {
            this.focused = true;
            event.target.select();
        }, input(event) {
            this.v = event.target.value;
            this.$emit('input', this.v);
        } }, mounted() { this.v = this.value; } };

Vue.component('app', { render() { with (this) {
        return _c('div', { attrs: { "id": "app" }, on: { "mousedown": function ($event) { $event.stopPropagation(); }, "touchstart": function ($event) { $event.stopPropagation(); } } }, [_c('toolbar', { on: { "panel": function ($event) { showPanel = !showPanel; }, "share": function ($event) { return show('share'); }, "about": function ($event) { return show('about'); }, "news": function ($event) { return show('ver'); }, "pref": function ($event) { return show('pref'); } } }), _v(" "), _c('welcome'), _v(" "), _c('spinner'), _v(" "), _c('div', { class: { 'show': showPanel }, attrs: { "id": "divShade" }, on: { "mousedown": function ($event) { showPanel = false; }, "touchstart": function ($event) { showPanel = false; } } }), _v(" "), _c('panel', { attrs: { "show": showPanel } }), _v(" "), _c('dpad'), _v(" "), _c('share', { ref: "share" }), _v(" "), _c('about', { ref: "about" }), _v(" "), _c('version', { ref: "ver" }), _v(" "), _c('preference', { ref: "pref" })], 1);
    } }, mixins: [BaseComponent], data() { return { showPanel: false }; }, watch: { "design"(v) {
            if (!v)
                this.showPanel = false;
        } }, methods: { show(el) {
            this.$refs[el].show();
        } }, mounted() {
        // iPhone 6 不支援 CSS 的 touch-action: none
        if (getComputedStyle(this.$el).touchAction != "none") {
            this.$el.addEventListener("touchmove", (e) => {
                if (e.touches.length > 1)
                    e.preventDefault();
            });
        }
    } });

Vue.component('core', { render() { with (this) {
        return _c('div', [_c('confirm', { ref: "confirm" }), _v(" "), _c('alert', { ref: "alert" }), _v(" "), (design && design.patternNotFound) ? _c('note') : _e(), _v(" "), _c('div', { ref: "mdlLanguage", staticClass: "modal fade" }, [_c('div', { staticClass: "modal-dialog modal-dialog-centered" }, [_c('div', { staticClass: "modal-content" }, [_c('div', { staticClass: "modal-body" }, [_c('div', { staticClass: "row" }, _l((languages), function (l) { return _c('div', { key: l, staticClass: "col text-center" }, [_c('button', { staticClass: "w-100 btn btn-light", attrs: { "data-bs-dismiss": "modal" }, on: { "click": function ($event) { i18n.locale = l; } } }, [_c('img', { attrs: { "src": 'assets/flags/' + $t('flag', l) + '.png', "alt": $t('flag', l), "width": "64", "height": "64" } }), _v(" "), _c('br'), _v("\n\t\t\t\t\t\t\t\t" + _s($t('name', l)) + "\n\t\t\t\t\t\t\t")])]); }), 0)])])])])], 1);
    } }, data() { return { designs: [], tabHistory: [], autoSave: true, showDPad: true, updated: false, isTouch: undefined, libReady: undefined, initReady: undefined, initialized: false, id: new Date().getTime(), languages: [], mdlLanguage: undefined, loader: undefined, dropdown: null }; }, watch: { 'i18n.locale'() { this.onLocaleChanged(); } }, computed: { i18n() { return i18n; }, copyright() {
            let y = new Date().getFullYear();
            let end = y > 2020 ? "-" + y : "";
            return this.$t('welcome.copyright', [end]);
        }, shouldShowDPad() {
            return this.initialized && this.isTouch && this.showDPad && bp.system.selections.length > 0;
        }, design() {
            if (!this.initialized)
                return null;
            let t = bp.design ? bp.design.title : null;
            document.title = "Box Pleating Studio" + (t ? " - " + t : "");
            return bp.design;
        }, selections() {
            if (!this.initialized)
                return [];
            return bp.system.selections;
        } }, methods: { async init() {
            bp.onDeprecate = (title) => {
                title = title || this.$t("keyword.untitled");
                this.alert(this.$t("message.oldVersion", [title]));
            };
            let settings = JSON.parse(localStorage.getItem("settings"));
            if (settings) {
                let d = bp.$display.settings;
                for (let key in d)
                    d[key] = settings[key];
            }
            // 舊資料；過一陣子之後可以拿掉這一段程式碼
            localStorage.removeItem("sessionId");
            localStorage.removeItem("sessionTime");
            // 只有擁有存檔權的實體會去讀取 session
            if (await this.checkSession()) {
                let session = JSON.parse(localStorage.getItem("session"));
                if (session) {
                    session.jsons.forEach(j => this.addDesign(bp.restore(j), false));
                    if (session.open >= 0)
                        this.select(this.designs[session.open]);
                    bp.update();
                }
            }
            let url = new URL(location.href);
            let lz = url.searchParams.get("project"), json;
            if (lz) {
                try {
                    json = JSON.parse(LZ.decompress(lz));
                }
                catch (e) { }
            }
            if (lz != sessionStorage.getItem("project") && json) {
                // 寫入 sessionStorage 的值不會因為頁籤 reload 而遺失，
                // 因此可以用這個來避免重刷頁面的時候再次載入的問題
                sessionStorage.setItem("project", lz);
                this.addDesign(bp.load(json));
                gtag('event', 'share_open');
            }
            setInterval(() => this.save(), 3000);
            window.addEventListener("beforeunload", () => this.save());
            this.initialized = true;
        }, loadSettings() {
            let settings = JSON.parse(localStorage.getItem("settings"));
            if (settings) {
                this.autoSave = settings.autoSave;
                if (settings.showDPad !== undefined)
                    this.showDPad = settings.showDPad;
            }
            let l = localStorage.getItem("locale");
            let v = Number(localStorage.getItem("build") || 0);
            let r = (l) => l.replace(/_/g, "-").toLowerCase();
            if (navigator.languages) {
                let locales = Object.keys(locale);
                let languages = navigator.languages
                    .map(a => locales.find(l => r(a).startsWith(l)))
                    .filter(l => !!l);
                if (l)
                    languages.unshift(l);
                languages = Array.from(new Set(languages));
                // 跳出語言選項的條件：沒有語言設定、或者有新加入的支援語言
                if (languages.length > 1 && (!l || languages.some(l => locale[l].since > v))) {
                    this.languages = languages;
                    this.libReady.then(() => this.mdlLanguage.show());
                }
                if (!l)
                    l = languages[0] || navigator.languages[0];
            }
            if (!l)
                l = "en";
            i18n.locale = r(l);
            localStorage.setItem("build", app_config.app_version);
            this.onLocaleChanged();
        }, onLocaleChanged() {
            if (i18n.locale in locale) {
                localStorage.setItem("locale", i18n.locale);
            }
            else
                Vue.nextTick(() => {
                    let chain = i18n._localeChainCache[i18n.locale];
                    for (let l of chain)
                        if (l in locale) {
                            i18n.locale = l;
                            return;
                        }
                });
        }, saveSettings() {
            if (!this.initialized)
                return;
            let { showGrid, showHinge, showRidge, showAxialParallel, showLabel, showDot, includeHiddenElement } = bp.$display.settings;
            if (this.autoSave)
                this.save();
            else
                localStorage.removeItem("session");
            localStorage.setItem("settings", JSON.stringify({
                autoSave: this.autoSave,
                showDPad: this.showDPad,
                includeHiddenElement,
                showGrid, showHinge, showRidge,
                showAxialParallel, showLabel, showDot
            }));
        }, open(d) {
            if (typeof d == "string") {
                this.addDesign(bp.design = bp.load(d));
            }
            else {
                this.addDesign(bp.design = bp.restore(d));
            }
        }, checkSession() {
            return new Promise(resolve => {
                // 減少本地偵錯的負擔
                if (location.protocol != "https:")
                    resolve(true);
                else {
                    // 理論上整個檢查瞬間就能做完，所以過了 1/4 秒仍然沒有結果就視為失敗
                    let cancel = setTimeout(() => resolve(false), 250);
                    callService("id")
                        .then((id) => resolve(this.id < id), // 最舊的實體優先
                    () => resolve(true) // 沒有 Service Worker 的時候直接視為可以
                    )
                        .finally(() => clearTimeout(cancel));
                }
            });
        }, async save() {
            // 拖曳的時候存檔無意義且浪費效能，跳過
            if (bp.system.dragging)
                return;
            // 只有當前的實體取得存檔權的時候才會儲存
            if (this.autoSave && await this.checkSession()) {
                // 排程到下一次 BPStudio 更新完畢之後存檔，
                // 避免在存檔的瞬間製造出 glitch
                bp.onUpdate = () => {
                    let session = {
                        jsons: this.designs.map(id => bp.designMap.get(id).toJSON(true)),
                        open: bp.design ? this.designs.indexOf(bp.design.id) : -1
                    };
                    localStorage.setItem("session", JSON.stringify(session));
                };
            }
        }, create() {
            let j = { title: this.$t('keyword.untitled') };
            let d = bp.create(this.checkTitle(j));
            this.addDesign(bp.design = d);
            this.scrollTo(d.id);
        }, scrollTo(id) {
            Vue.nextTick(() => {
                let el = document.getElementById(`tab${id}`);
                if (el)
                    el.scrollIntoView({
                        behavior: "smooth",
                        inline: "end"
                    });
            });
        }, select(id) {
            bp.select(id);
            let i = this.tabHistory.indexOf(id);
            if (i >= 0)
                this.tabHistory.splice(i, 1);
            this.tabHistory.unshift(id);
            this.scrollTo(id);
        }, selectLast() {
            bp.select(this.tabHistory.length ? this.tabHistory[0] : null);
            bp.update();
        }, async closeCore(id) {
            let d = bp.designMap.get(id);
            let title = d.title || this.$t("keyword.untitled");
            if (d.history.modified) {
                this.select(id);
                let message = this.$t("message.unsaved", [title]);
                if (!(await this.confirm(message)))
                    return false;
            }
            this.designs.splice(this.designs.indexOf(id), 1);
            this.tabHistory.splice(this.tabHistory.indexOf(id), 1);
            bp.close(id);
            return true;
        }, async close(id) {
            if (id === undefined)
                id = bp.design.id;
            if (await this.closeCore(id))
                this.selectLast();
        }, async closeBy(predicate) {
            let promises = [];
            for (let i of this.designs.concat())
                if (predicate(i))
                    promises.push(this.closeCore(i));
            await Promise.all(promises);
            this.selectLast();
        }, async closeOther(id) {
            await this.closeBy(i => i != id);
        }, async closeRight(id) {
            await this.closeBy(i => i > id);
        }, async closeAll() {
            await this.closeBy(i => true);
        }, clone(id) {
            if (id === undefined)
                id = bp.design.id;
            let i = this.designs.indexOf(id);
            let c = bp.restore(this.checkTitle(bp.designMap.get(id).toJSON()));
            this.designs.splice(i + 1, 0, (bp.design = c).id);
            bp.update();
            gtag('event', 'project_clone');
        }, addDesign(d, select) {
            this.designs.push(d.id);
            if (select)
                this.select(d.id);
            else
                this.tabHistory.unshift(d.id);
        }, checkTitle(j) {
            let t = j.title.replace(/ - \d+$/, ""), n = 1;
            let designs = [...bp.designMap.values()];
            if (!designs.some(d => d.title == t))
                return j;
            while (designs.some(d => d.title == t + " - " + n))
                n++;
            j.title = t + " - " + n;
            return j;
        }, async zip() {
            await this.libReady;
            let zip = new JSZip();
            let names = new Set();
            for (let i = 0; i < this.designs.length; i++) {
                let design = bp.designMap.get(this.designs[i]);
                let name = sanitize(design.title);
                if (names.has(name)) {
                    for (var j = 1; names.has(name + " (" + j + ")"); j++)
                        ;
                    name = name + " (" + j + ")";
                }
                names.add(name);
                zip.file(name + ".bps", JSON.stringify(design));
            }
            let blob = await zip.generateAsync({
                type: 'blob',
                compression: "DEFLATE",
                compressionOptions: { level: 9 }
            });
            return URL.createObjectURL(blob);
        }, async alert(message) {
            await this.$refs.alert.show(message);
        }, async confirm(message) {
            return await this.$refs.confirm.show(message);
        } }, created() {
        this.isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
        this.libReady = new Promise(resolve => {
            // DOMContentLoaded 事件會在所有延遲函式庫載入完成之後觸發
            window.addEventListener('DOMContentLoaded', () => resolve());
        });
        this.initReady = new Promise(resolve => {
            // 安全起見還是設置一個一秒鐘的 timeout，以免 Promise 永遠擱置
            setTimeout(() => resolve(), 1000);
            // 程式剛載入的時候 Spinner 動畫的啟動用來當作載入的觸發依據
            document.addEventListener("animationstart", () => resolve(), { once: true });
        });
    }, mounted() {
        this.libReady.then(() => this.mdlLanguage = new bootstrap.Modal(this.$refs.mdlLanguage));
        this.loadSettings();
    } });

Vue.component('dpad', { render() { with (this) {
        return _c('div', { class: { 'show': show, 'disabled': disabled }, attrs: { "id": "divDPad" } }, [_c('keybutton', { staticClass: "bp-up", staticStyle: { "top": "0rem", "left": "2.5rem" }, on: { "key": function ($event) { return key('up'); } } }), _v(" "), _c('keybutton', { staticClass: "bp-left", staticStyle: { "top": "2.5rem", "left": "0rem" }, on: { "key": function ($event) { return key('left'); } } }), _v(" "), _c('keybutton', { staticClass: "bp-right", staticStyle: { "top": "2.5rem", "left": "5rem" }, on: { "key": function ($event) { return key('right'); } } }), _v(" "), _c('keybutton', { staticClass: "bp-down", staticStyle: { "top": "5rem", "left": "2.5rem" }, on: { "key": function ($event) { return key('down'); } } })], 1);
    } }, computed: { show() { return core.shouldShowDPad; }, disabled() { return !core.initialized || bp.system.dragging; } }, methods: { key(key) {
            bp.system.key(key);
        } } });

Vue.component('welcome', { render() { with (this) {
        return (!core.design && core.initialized) ? _c('div', { staticClass: "welcome p-3", attrs: { "id": "divWelcome" } }, [_c('div', [_c('h2', { directives: [{ name: "t", rawName: "v-t", value: ('welcome.title'), expression: "'welcome.title'" }], staticClass: "d-none d-sm-block" }), _v(" "), _c('h3', { directives: [{ name: "t", rawName: "v-t", value: ('welcome.title'), expression: "'welcome.title'" }], staticClass: "d-sm-none" }), _v(" "), _c('p', { directives: [{ name: "t", rawName: "v-t", value: ('welcome.intro[0]'), expression: "'welcome.intro[0]'" }], staticClass: "mt-4" }), _v(" "), _c('i18n', { attrs: { "path": "welcome.intro[1]", "tag": "p" } }, [_c('a', { attrs: { "target": "_blank", "rel": "noopener", "href": "https://github.com/MuTsunTsai/box-pleating-studio" } }, [_v("GitHub")])])], 1), _v(" "), _c('div', { staticClass: "browser-only" }, [((bi || ios) && !install) ? _c('div', [_c('p', { directives: [{ name: "t", rawName: "v-t", value: ('welcome.install.hint'), expression: "'welcome.install.hint'" }] }), _v(" "), (ios) ? _c('p', { directives: [{ name: "t", rawName: "v-t", value: ('welcome.install.ios'), expression: "'welcome.install.ios'" }] }) : _c('button', { directives: [{ name: "t", rawName: "v-t", value: ('welcome.install.bt'), expression: "'welcome.install.bt'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return bi.prompt(); } } })]) : _e(), _v(" "), (install == 1) ? _c('div', { directives: [{ name: "t", rawName: "v-t", value: ('welcome.install.ing'), expression: "'welcome.install.ing'" }] }) : _e(), _v(" "), (install == 2) ? _c('div', [_c('p', { directives: [{ name: "t", rawName: "v-t", value: ('welcome.install.ed'), expression: "'welcome.install.ed'" }] }), _v(" "), _c('a', { directives: [{ name: "t", rawName: "v-t", value: ('welcome.install.open'), expression: "'welcome.install.open'" }], staticClass: "btn btn-primary", attrs: { "rel": "noopener", "href": "https://bpstudio.abstreamace.com/", "target": "_blank" } })]) : _e()]), _v(" "), _c('div', { staticStyle: { "position": "absolute", "bottom": "1rem", "right": "1rem" } }, [_v(_s(core.copyright))])]) : _e();
    } }, data() { return { bi: undefined, install: 0, ios: navigator.standalone === false }; }, computed: { core() { return core; } }, methods: { detectInstallation() {
            if ('getInstalledRelatedApps' in navigator) {
                navigator.getInstalledRelatedApps().then(apps => {
                    if (apps.length)
                        this.install = 2;
                });
            }
        } }, created() {
        window.addEventListener("beforeinstallprompt", event => {
            event.preventDefault();
            this.bi = event;
        });
        window.addEventListener("appinstalled", () => {
            if (matchMedia("(display-mode: standalone)").matches)
                return; // 桌機會進入這裡
            this.install = 1;
            let i = setInterval(() => {
                if (this.install != 2)
                    this.detectInstallation();
                else
                    clearInterval(i);
            }, 2000);
        });
        this.detectInstallation();
    } });

Vue.component('about', { render() { with (this) {
        return _c('div', { staticClass: "modal fade" }, [_c('div', { staticClass: "modal-dialog modal-dialog-centered" }, [_c('div', { staticClass: "modal-content mx-4" }, [_c('div', { staticClass: "modal-header" }, [_c('div', { directives: [{ name: "t", rawName: "v-t", value: ('about.title'), expression: "'about.title'" }], staticClass: "h4 modal-title" })]), _v(" "), _c('div', { staticClass: "modal-body" }, [_c('p', [_v(_s(copyright))]), _v(" "), _c('p', { directives: [{ name: "t", rawName: "v-t", value: ('about.license'), expression: "'about.license'" }] }), _v(" "), _c('i18n', { attrs: { "path": "about.visit", "tag": "p" } }, [_c('a', { directives: [{ name: "t", rawName: "v-t", value: ('about.homepage'), expression: "'about.homepage'" }], attrs: { "target": "_blank", "rel": "noopener", "href": "https://github.com/MuTsunTsai/box-pleating-studio" } })]), _v(" "), _c('i18n', { attrs: { "path": "about.donation", "tag": "p" } }, [_c('a', { attrs: { "target": "_blank", "href": "donate.htm" } }, [_v("PayPal")])])], 1), _v(" "), _c('div', { staticClass: "modal-footer" }, [_c('div', { staticClass: "flex-grow-1" }, [_v(_s($t('keyword.version')) + " " + _s(version))]), _v(" "), _c('button', { directives: [{ name: "t", rawName: "v-t", value: ('keyword.ok'), expression: "'keyword.ok'" }], staticClass: "btn btn-primary", attrs: { "type": "button", "data-bs-dismiss": "modal" } })])])])]);
    } }, data() { return { modal: undefined }; }, computed: { copyright() { return core.copyright; }, version() {
            let meta = document.querySelector("meta[name=version]");
            return meta.content + " build " + app_config.app_version;
        } }, methods: { async show() {
            await core.libReady;
            this.modal.show();
            gtag('event', 'screen_view', { screen_name: 'About' });
        } }, mounted() {
        core.libReady.then(() => this.modal = new bootstrap.Modal(this.$el));
    } });

Vue.component('alert', { render() { with (this) {
        return _c('div', { staticClass: "modal fade" }, [_c('div', { staticClass: "modal-dialog modal-dialog-centered" }, [_c('div', { staticClass: "modal-content" }, [_c('div', { staticClass: "modal-body" }, [_v(_s(message))]), _v(" "), _c('div', { staticClass: "modal-footer" }, [_c('button', { directives: [{ name: "t", rawName: "v-t", value: ('keyword.ok'), expression: "'keyword.ok'" }], staticClass: "btn btn-primary", attrs: { "type": "button", "data-bs-dismiss": "modal" } })])])])]);
    } }, mixins: [Dialog], methods: { resolve(res) {
            this.$el.addEventListener('hidden.bs.modal', () => res(), { once: true });
        } } });

Vue.component('confirm', { render() { with (this) {
        return _c('div', { staticClass: "modal fade" }, [_c('div', { staticClass: "modal-dialog modal-dialog-centered" }, [_c('div', { staticClass: "modal-content" }, [_c('div', { staticClass: "modal-body" }, [_v(_s(message))]), _v(" "), _c('div', { staticClass: "modal-footer" }, [_c('button', { directives: [{ name: "t", rawName: "v-t", value: ('keyword.no'), expression: "'keyword.no'" }], staticClass: "btn btn-secondary", attrs: { "type": "button", "data-bs-dismiss": "modal" } }), _v(" "), _c('button', { directives: [{ name: "t", rawName: "v-t", value: ('keyword.yes'), expression: "'keyword.yes'" }], staticClass: "btn btn-primary", attrs: { "type": "button", "data-bs-dismiss": "modal" }, on: { "click": function ($event) { value = true; } } })])])])]);
    } }, mixins: [Dialog], data() { return { value: false }; }, methods: { resolve(res) {
            this.value = false;
            this.$el.addEventListener('hidden.bs.modal', () => res(this.value), { once: true });
        } } });

Vue.component('note', { render() { with (this) {
        return _c('div', [_c('button', { staticClass: "btn btn-light text-warning", attrs: { "id": "note" }, on: { "click": note } }, [_c('i', { staticClass: "fas fa-exclamation-triangle h1" })]), _v(" "), _c('div', { ref: "mdl", staticClass: "modal fade" }, [_c('div', { staticClass: "modal-dialog modal-dialog-centered" }, [_c('div', { staticClass: "modal-content" }, [_c('div', { directives: [{ name: "t", rawName: "v-t", value: ('message.patternNotFound'), expression: "'message.patternNotFound'" }], staticClass: "modal-body" }), _v(" "), _c('div', { staticClass: "modal-footer" }, [_c('button', { directives: [{ name: "t", rawName: "v-t", value: ('keyword.ok'), expression: "'keyword.ok'" }], staticClass: "btn btn-primary", attrs: { "type": "button", "data-bs-dismiss": "modal" } })])])])])]);
    } }, data() { return { modal: undefined }; }, methods: { async note() {
            await core.libReady;
            this.modal.show();
            gtag('event', 'screen_view', { screen_name: 'Note' });
        } }, mounted() {
        core.libReady.then(() => this.modal = new bootstrap.Modal(this.$refs.mdl));
    } });

Vue.component('preference', { render() { with (this) {
        return _c('div', { staticClass: "modal fade" }, [_c('div', { staticClass: "modal-dialog modal-dialog-centered" }, [_c('div', { staticClass: "modal-content mx-4" }, [_c('div', { staticClass: "modal-header" }, [_c('div', { directives: [{ name: "t", rawName: "v-t", value: ('toolbar.setting.preference'), expression: "'toolbar.setting.preference'" }], staticClass: "h4 modal-title" })]), _v(" "), _c('div', { staticClass: "modal-body" }, [_c('div', { staticClass: "row mb-2" }, [_c('label', { staticClass: "col-form-label col-4" }, [_v(_s($t('preference.language')))]), _v(" "), _c('div', { staticClass: "col-8" }, [_c('select', { directives: [{ name: "model", rawName: "v-model", value: (i18n.locale), expression: "i18n.locale" }], staticClass: "form-select", on: { "change": function ($event) { var $$selectedVal = Array.prototype.filter.call($event.target.options, function (o) { return o.selected; }).map(function (o) { var val = "_value" in o ? o._value : o.value; return val; }); $set(i18n, "locale", $event.target.multiple ? $$selectedVal : $$selectedVal[0]); } } }, _l((i18n.availableLocales), function (l) { return _c('option', { directives: [{ name: "t", rawName: "v-t", value: ({ path: 'name', locale: l }), expression: "{path:'name',locale:l}" }], key: l, domProps: { "value": l } }); }), 0)])]), _v(" "), _c('checkbox', { attrs: { "label": $t('preference.autoSave') }, on: { "input": function ($event) { return core.saveSettings(); } }, model: { value: (core.autoSave), callback: function ($$v) { $set(core, "autoSave", $$v); }, expression: "core.autoSave" } }), _v(" "), (core.initialized) ? _c('checkbox', { attrs: { "label": $t('preference.includeHidden') }, on: { "input": function ($event) { return core.saveSettings(); } }, model: { value: (display.includeHiddenElement), callback: function ($$v) { $set(display, "includeHiddenElement", $$v); }, expression: "display.includeHiddenElement" } }) : _e()], 1), _v(" "), _c('div', { staticClass: "modal-footer" }, [_c('button', { directives: [{ name: "t", rawName: "v-t", value: ('keyword.ok'), expression: "'keyword.ok'" }], staticClass: "btn btn-primary", attrs: { "type": "button", "data-bs-dismiss": "modal" } })])])])]);
    } }, data() { return { modal: undefined }; }, computed: { i18n() { return i18n; }, core() { return core; }, display() { return core.initialized ? bp.$display.settings : {}; } }, methods: { async show() {
            await core.libReady;
            this.modal.show();
            gtag('event', 'screen_view', { screen_name: 'Preference' });
        } }, mounted() {
        core.libReady.then(() => this.modal = new bootstrap.Modal(this.$el));
    } });

Vue.component('share', { render() { with (this) {
        return _c('div', { staticClass: "modal fade" }, [_c('div', { staticClass: "modal-dialog modal-dialog-centered" }, [_c('div', { staticClass: "modal-content mx-4" }, [_c('div', { staticClass: "modal-header" }, [_c('div', { directives: [{ name: "t", rawName: "v-t", value: ('share.title'), expression: "'share.title'" }], staticClass: "h4 modal-title" })]), _v(" "), _c('div', { staticClass: "modal-body" }, [_c('div', { staticClass: "mb-2" }, [_c('div', { staticClass: "input-group" }, [_c('input', { staticClass: "form-control", attrs: { "disabled": sending }, domProps: { "value": url } }), _v(" "), (!short) ? _c('button', { staticClass: "btn btn-primary", attrs: { "disabled": sending }, on: { "click": shorten } }, [_v("\n\t\t\t\t\t\t\t" + _s($t('share.shorten')) + "\n\t\t\t\t\t\t\t"), (sending) ? _c('i', { staticClass: "bp-spinner fa-spin" }) : _e()]) : _e()])]), _v(" "), (ready) ? _c('div', { staticClass: "d-flex" }, [_c('div', [_c('button', { directives: [{ name: "clipboard", rawName: "v-clipboard:copy", value: (url), expression: "url", arg: "copy" }, { name: "clipboard", rawName: "v-clipboard:success", value: (onCopy), expression: "onCopy", arg: "success" }], staticClass: "btn btn-primary", attrs: { "disabled": sending } }, [_c('i', { staticClass: "fas fa-copy" }), _v("\n\t\t\t\t\t\t\t" + _s($t('share.copy')) + "\n\t\t\t\t\t\t\t"), _c('i', { ref: "success", staticClass: "fas fa-check d-inline-block", staticStyle: { "transition": "width .5s", "width": "0px", "overflow": "hidden" } })]), _v(" "), (canShare) ? _c('button', { staticClass: "btn btn-primary", attrs: { "disabled": sending }, on: { "click": share } }, [_c('i', { staticClass: "fas fa-share" }), _v("\n\t\t\t\t\t\t\t" + _s($t('share.share')) + "\n\t\t\t\t\t\t")]) : _e()]), _v(" "), _c('div', { staticClass: "flex-grow-1 text-end col-form-label" }, [_v(_s(error))])]) : _e()]), _v(" "), _c('div', { staticClass: "modal-footer" }, [_c('button', { directives: [{ name: "t", rawName: "v-t", value: ('keyword.ok'), expression: "'keyword.ok'" }], staticClass: "btn btn-primary", attrs: { "type": "button", "data-bs-dismiss": "modal" } })])])])]);
    } }, mixins: [BaseComponent], data() { return { url: "", modal: undefined, canShare: !!navigator.share, ready: false, sending: false, short: false, error: null }; }, methods: { json() {
            if (!this.design)
                return undefined;
            return JSON.stringify(this.design);
        }, async show() {
            await core.libReady;
            this.url = "https://bpstudio.abstreamace.com/?project=" + LZ.compress(this.json());
            this.short = false;
            this.modal.show();
            gtag('event', 'screen_view', { screen_name: 'Share' });
        }, onCopy() {
            let s = this.$refs.success;
            s.style.width = "20px";
            setTimeout(() => s.style.width = "0px", 3000);
            gtag('event', 'share', { method: 'copy', content_type: 'link' });
        }, share() {
            navigator.share({
                title: "Box Pleating Studio",
                text: this.$t("share.message", [this.design.title]),
                url: this.url
            }).catch(() => { }); // 捕捉取消之類的錯誤，不處理
            gtag('event', 'share', { method: 'app', content_type: 'link' });
        }, async shorten() {
            this.sending = true;
            try {
                let response = await fetch("https://tinyurl.com/api-create.php?url=" + encodeURIComponent(this.url));
                this.url = await response.text();
                this.short = true;
            }
            catch (e) {
                this.error = this.$t('message.connFail');
                setTimeout(() => this.error = null, 3000);
            }
            this.sending = false;
        } }, mounted() {
        core.libReady.then(() => {
            this.ready = true;
            this.modal = new bootstrap.Modal(this.$el);
        });
    } });

Vue.component('version', { render() { with (this) {
        return _c('div', { staticClass: "modal fade" }, [_c('div', { staticClass: "modal-dialog modal-dialog-centered" }, [_c('div', { staticClass: "modal-content mx-4" }, [_c('div', { staticClass: "modal-body scroll-shadow", staticStyle: { "max-height": "70vh", "border-radius": "0.3rem" } }, [(record[index]) ? _c('div', { domProps: { "innerHTML": _s(record[index]) } }) : _c('div', { staticClass: "m-5 display-2 text-muted text-center" }, [_c('i', { staticClass: "bp-spinner fa-spin" })])]), _v(" "), _c('div', { staticClass: "modal-footer" }, [_c('div', { staticClass: "flex-grow-1" }, [_c('button', { staticClass: "btn btn-primary", attrs: { "disabled": index == 0 }, on: { "click": function ($event) { index--; } } }, [_c('i', { staticClass: "fas fa-caret-left" })]), _v(" "), _c('button', { staticClass: "btn btn-primary", attrs: { "disabled": index == max }, on: { "click": function ($event) { index++; } } }, [_c('i', { staticClass: "fas fa-caret-right" })])]), _v(" "), _c('button', { directives: [{ name: "t", rawName: "v-t", value: ('keyword.ok'), expression: "'keyword.ok'" }], staticClass: "btn btn-primary", attrs: { "type": "button", "data-bs-dismiss": "modal" } })])])])]);
    } }, data() { return { record: {}, index: undefined, max: undefined, active: false, modal: undefined }; }, watch: { 'index'(index) {
            this.load(index);
        } }, methods: { async load(index) {
            await core.libReady;
            if (!this.record[index]) {
                try {
                    let response = await fetch(`log/${logs[index]}.md`);
                    Vue.set(this.record, this.index, marked(await response.text()));
                }
                catch (e) {
                    if (this.active) {
                        this.modal.hide();
                        core.alert(this.$t("message.connFail"));
                    }
                    return false;
                }
            }
            return true;
        }, async show() {
            await core.libReady;
            this.active = true;
            if (await this.load(this.index)) {
                this.modal.show();
                gtag('event', 'screen_view', { screen_name: 'News' });
            }
        } }, mounted() {
        if ('serviceWorker' in navigator)
            navigator.serviceWorker.addEventListener('message', async (event) => {
                if (event.data.meta === 'workbox-broadcast-update') {
                    let m = event.data.payload.path.match(/\d+(?=\.md$)/);
                    if (m) {
                        let index = logs.indexOf(Number(m[0]));
                        delete this.record[index];
                        this.load(index);
                    }
                }
            });
        core.libReady.then(() => this.modal = new bootstrap.Modal(this.$el));
        this.index = this.max = logs.length - 1;
    } });

Vue.component('checkbox', { render() { with (this) {
        return _c('div', { staticClass: "row mb-2 py-1" }, [_c('div', { staticClass: "col" }, [_c('div', { staticClass: "form-check form-switch" }, [_c('input', { directives: [{ name: "model", rawName: "v-model", value: (v), expression: "v" }], staticClass: "form-check-input", attrs: { "type": "checkbox", "id": id }, domProps: { "checked": Array.isArray(v) ? _i(v, null) > -1 : (v) }, on: { "change": function ($event) { var $$a = v, $$el = $event.target, $$c = $$el.checked ? (true) : (false); if (Array.isArray($$a)) {
                                var $$v = null, $$i = _i($$a, $$v);
                                if ($$el.checked) {
                                    $$i < 0 && (v = $$a.concat([$$v]));
                                }
                                else {
                                    $$i > -1 && (v = $$a.slice(0, $$i).concat($$a.slice($$i + 1)));
                                }
                            }
                            else {
                                v = $$c;
                            } } } }), _v(" "), _c('label', { staticClass: "form-check-label", attrs: { "for": id } }, [_v(_s(label))])])])]);
    } }, mixins: [InputMixin], props: { label: String }, watch: { 'v'(checked) {
            this.$emit('input', checked);
        } } });

Vue.component('contextmenu', { render() { with (this) {
        return _c('div', { staticClass: "dropdown-menu", on: { "touchstartout": hide, "mousedownout": hide, "touchend": hide, "mouseup": hide } }, [_t("default")], 2);
    } }, data() { return { shown: false }; }, methods: { show(e) {
            Popper.createPopper({
                getBoundingClientRect() {
                    return {
                        top: e.pageY,
                        bottom: e.pageY,
                        left: e.pageX,
                        right: e.pageX,
                        width: 0,
                        height: 0
                    };
                }
            }, this.$el, {
                placement: "bottom-start"
            });
            this.$el.classList.add('show');
            this.shown = true;
        }, hide() {
            if (this.shown) {
                // 這邊必須設置一個延遲，否則觸控模式中會不能按
                // 已知設定延遲為 10 在某些版本的 Safari 上面是不夠的，所以安全起見設成 50
                setTimeout(() => this.$el.classList.remove('show'), 50);
                this.shown = false;
            }
        } } });

Vue.component('divider', { render() { with (this) {
        return _c('div', { staticStyle: { "overflow": "auto" }, on: { "click": function ($event) { $event.stopPropagation(); } } }, [_c('div', { staticClass: "dropdown-divider" })]);
    } } });

Vue.component('download', { render() { with (this) {
        return (!disabled) ? _c('a', { class: btn ? 'btn btn-primary' : 'dropdown-item', attrs: { "href": href, "download": file.name, "title": $t('message.downloadHint') }, on: { "click": function ($event) { return download($event); }, "mouseover": getFile, "contextmenu": function ($event) { $event.stopPropagation(); return contextMenu($event); } } }, [_t("default")], 2) : _c('div', { staticClass: "dropdown-item disabled", on: { "click": function ($event) { $event.stopPropagation(); } } }, [_t("default")], 2);
    } }, data() { return { href: "#", downloaded: undefined, downloading: undefined, creating: null }; }, props: { file: Object, disabled: Boolean, btn: { type: Boolean, default: false } }, methods: { download(event) {
            if (this.href == "#") {
                this.downloading = new Promise(resolve => this.downloaded = resolve);
                if (event)
                    event.preventDefault();
                this.getFile().then(() => this.$el.click());
            }
            else {
                if (this.downloaded)
                    this.downloaded();
                this.downloaded = null;
                this.$emit('download');
            }
        }, contextMenu() {
            this.getFile();
            this.$emit('download');
        }, async getFile() {
            await this.creating;
            if (this.href == "#") {
                this.creating = this.file.content();
                this.href = await this.creating;
                this.creating = null;
            }
        }, async reset() {
            // 延遲回收以免下載失敗
            await this.downloading;
            setTimeout(() => {
                URL.revokeObjectURL(this.href);
                this.href = "#";
            }, 500);
        } } });

Vue.component('dropdown', { render() { with (this) {
        return _c('div', { staticClass: "btn-group" }, [_c('button', { ref: "btn", staticClass: "btn btn-primary dropdown-toggle", attrs: { "type": "button", "title": title, "disabled": !ready, "data-bs-toggle": "dropdown" }, on: { "mouseenter": mouseenter } }, [_c('i', { class: icon }), _v(" "), (notify) ? _c('div', { staticClass: "notify" }) : _e()]), _v(" "), _c('div', { ref: "menu", staticClass: "dropdown-menu", on: { "touchstartout": hide, "mousedownout": hide } }, [_t("default")], 2)]);
    } }, data() { return { dropdown: undefined }; }, props: { icon: String, title: String, notify: Boolean }, computed: { ready() { return core.initialized; } }, methods: { async hide() {
            await core.libReady;
            this.dropdown.hide();
        }, mouseenter() {
            if (core.dropdown && core.dropdown != this)
                this.$refs.btn.click();
        } }, mounted() {
        let self = this;
        core.libReady.then(() => this.dropdown = new bootstrap.Dropdown(this.$refs.btn, {}));
        this.$el.addEventListener('shown.bs.dropdown', function () { core.dropdown = self; });
        this.$el.addEventListener('hide.bs.dropdown', function () { core.dropdown = null; });
        this.$el.addEventListener('hidden.bs.dropdown', () => this.$emit('hide'));
    } });

Vue.component('dropdownitem', { render() { with (this) {
        return (!disabled) ? _c('div', { staticClass: "dropdown-item", on: { "click": function ($event) { return $emit('click'); } } }, [_t("default")], 2) : _c('div', { staticClass: "dropdown-item disabled", on: { "click": function ($event) { $event.stopPropagation(); } } }, [_t("default")], 2);
    } }, props: { disabled: Boolean } });

Vue.component('field', { render() { with (this) {
        return _c('div', { staticClass: "row mb-2" }, [_c('label', { staticClass: "col-form-label col-3" }, [_v(_s(label))]), _v(" "), _c('div', { staticClass: "col-9" }, [((type) === 'checkbox') ? _c('input', { directives: [{ name: "model", rawName: "v-model", value: (v), expression: "v" }], staticClass: "form-control", class: { error: v != value }, attrs: { "placeholder": placeholder, "type": "checkbox" }, domProps: { "checked": Array.isArray(v) ? _i(v, null) > -1 : (v) }, on: { "focus": function ($event) { return focus($event); }, "blur": blur, "input": function ($event) { return input($event); }, "change": function ($event) { var $$a = v, $$el = $event.target, $$c = $$el.checked ? (true) : (false); if (Array.isArray($$a)) {
                            var $$v = null, $$i = _i($$a, $$v);
                            if ($$el.checked) {
                                $$i < 0 && (v = $$a.concat([$$v]));
                            }
                            else {
                                $$i > -1 && (v = $$a.slice(0, $$i).concat($$a.slice($$i + 1)));
                            }
                        }
                        else {
                            v = $$c;
                        } } } }) : ((type) === 'radio') ? _c('input', { directives: [{ name: "model", rawName: "v-model", value: (v), expression: "v" }], staticClass: "form-control", class: { error: v != value }, attrs: { "placeholder": placeholder, "type": "radio" }, domProps: { "checked": _q(v, null) }, on: { "focus": function ($event) { return focus($event); }, "blur": blur, "input": function ($event) { return input($event); }, "change": function ($event) { v = null; } } }) : _c('input', { directives: [{ name: "model", rawName: "v-model", value: (v), expression: "v" }], staticClass: "form-control", class: { error: v != value }, attrs: { "placeholder": placeholder, "type": type }, domProps: { "value": (v) }, on: { "focus": function ($event) { return focus($event); }, "blur": blur, "input": [function ($event) { if ($event.target.composing)
                                return; v = $event.target.value; }, function ($event) { return input($event); }] } })])]);
    } }, mixins: [InputMixin], props: { label: String, type: String, placeholder: String } });

Vue.component('hotkey', { render() { with (this) {
        return _c('div', { staticClass: "d-flex" }, [_c('div', { staticClass: "flex-grow-1" }, [_c('i', { class: icon }), _v(" "), _t("default")], 2), _v(" "), _c('div', { staticClass: "ms-3 text-end desktop-only" }, [(ctrl) ? [(isMac) ? _c('i', { staticClass: "bp-command" }) : _c('span', [_v("Ctrl+")])] : _e(), _v(" "), (shift) ? [(isMac) ? _c('i', { staticClass: "bp-shift" }) : _c('span', [_v("Shift+")])] : _e(), _v("\n\t\t" + _s(hk) + "\n\t")], 2)]);
    } }, props: { icon: String, hk: String, ctrl: Boolean, shift: Boolean }, computed: { isMac() { return isMac; } } });

Vue.component('keybutton', { render() { with (this) {
        return _c('i', { on: { "touchstart": function ($event) { return down(750, $event); }, "touchend": up, "touchcancel": up } });
    } }, data() { return { to: undefined }; }, methods: { down(repeat, e) {
            if (core.shouldShowDPad) {
                this.$emit('key');
                this.to = setTimeout(() => this.down(150), repeat);
            }
            else
                this.up();
        }, up() {
            clearTimeout(this.to);
        } } });

Vue.component('number', { render() { with (this) {
        return _c('div', { class: label ? 'row mb-2' : '' }, [(label) ? _c('label', { staticClass: "col-form-label col-3" }, [_v(_s(label))]) : _e(), _v(" "), _c('div', { class: { 'col-9': label } }, [_c('div', { staticClass: "input-group", staticStyle: { "flex-wrap": "nowrap" } }, [_c('button', { staticClass: "btn btn-sm btn-primary", attrs: { "disabled": !canMinus, "type": "button" }, on: { "click": function ($event) { return change(-step); } } }, [_c('i', { staticClass: "fas fa-minus" })]), _v(" "), _c('input', { directives: [{ name: "model", rawName: "v-model", value: (v), expression: "v" }], staticClass: "form-control", class: { 'error': v != value }, staticStyle: { "min-width": "30px" }, attrs: { "type": "number", "min": min, "max": max }, domProps: { "value": (v) }, on: { "focus": function ($event) { return focus($event); }, "blur": blur, "input": [function ($event) { if ($event.target.composing)
                                    return; v = $event.target.value; }, function ($event) { return input($event); }], "wheel": function ($event) { return wheel($event); } } }), _v(" "), _c('button', { staticClass: "btn btn-sm btn-primary", attrs: { "disabled": !canPlus, "type": "button" }, on: { "click": function ($event) { return change(step); } } }, [_c('i', { staticClass: "fas fa-plus" })])])])]);
    } }, mixins: [InputMixin], data() { return { lastWheel: performance.now() }; }, props: { label: String, min: null, max: null, step: { type: Number, default: 1 } }, computed: { canMinus() {
            return this.min === undefined || this.v > this.min;
        }, canPlus() {
            return this.max === undefined || this.v < this.max;
        } }, methods: { input(event) {
            let v = Number(event.target.value);
            if (v < this.min || v > this.max)
                return;
            this.v = v;
            this.$emit('input', this.v);
        }, change(by) {
            // 這邊的計算起點採用 this.value 而非 this.v，
            // 以免高速的滾動導致結果錯誤
            let v = Math.round((this.value + by) / this.step) * this.step;
            if (v < this.min || v > this.max)
                return;
            this.$emit('input', v);
            return this.v = v;
        }, wheel(event) {
            event.stopPropagation();
            event.preventDefault();
            // 做一個 throttle 以免過度觸發
            let now = performance.now();
            if (now - this.lastWheel < 50)
                return;
            this.lastWheel = now;
            let by = Math.round(-event.deltaY / 100);
            this.change(by * this.step);
        } } });

Vue.component('spinner', { render() { with (this) {
        return _c('div', { directives: [{ name: "show", rawName: "v-show", value: (!core.initialized || loading), expression: "!core.initialized||loading" }], staticClass: "welcome", class: { 'shift-down': core.designs.length } }, [_m(0)]);
    } }, staticRenderFns: [function () { with (this) {
            return _c('div', { staticClass: "h-100 d-flex text-center align-items-center" }, [_c('div', { staticStyle: { "font-size": "min(15vh,15vw)", "color": "gray", "flex-grow": "1" } }, [_c('i', { staticClass: "bp-spinner fa-spin" })])]);
        } }], data() { return { loading: false }; }, computed: { core() { return core; } }, methods: { show() {
            this.loading = true;
            /**
             * 在 Safari 裡面，如果沒有等候到動畫畫面渲染完畢就繼續執行 JavaScript，
             * 結果就是動畫永遠不會出現。用 setTimeout 來延遲當然是一個辦法，
             * 但是我們並無法精確知道要延遲多久才夠，而且對其它瀏覽器來說也是不必要的等候，
             * 因此這邊我設置一個 Promise 來確定動畫開始，然後才繼續下一個步驟。
             */
            return new Promise(resolve => {
                // 安全起見還是設置一個一秒鐘的 timeout，以免 Promise 永遠擱置
                setTimeout(() => resolve(), 1000);
                this.$el.addEventListener("animationstart", () => resolve(), { once: true });
            });
        }, hide() {
            this.loading = false;
        } }, mounted() { core.loader = this; } });

Vue.component('store', { render() { with (this) {
        return _c('div', { staticClass: "row mb-1" }, [_c('label', { staticClass: "col-form-label col-5" }, [_v(_s(label))]), _v(" "), _c('div', { staticClass: "col-7" }, [_c('div', { staticClass: "input-group" }, [_c('button', { staticClass: "btn btn-sm btn-primary", attrs: { "type": "button" }, on: { "click": function ($event) { return data.move(-1); } } }, [_c('i', { staticClass: "fas fa-arrow-left" })]), _v(" "), _c('input', { staticClass: "form-control text-center", attrs: { "readonly": "", "type": "text" }, domProps: { "value": (data.index + 1) + ' / ' + data.size } }), _v(" "), _c('button', { staticClass: "btn btn-sm btn-primary", attrs: { "type": "button" }, on: { "click": function ($event) { return data.move(1); } } }, [_c('i', { staticClass: "fas fa-arrow-right" })])])])]);
    } }, props: { data: Object, label: String } });

Vue.component('uploader', { render() { with (this) {
        return _c('div', [_c('input', { staticClass: "d-none", attrs: { "type": "file", "id": id, "accept": type, "multiple": multiple }, on: { "change": function ($event) { return $emit('upload', $event); } } }), _v(" "), _c('label', { ref: "lbl", staticClass: "dropdown-item m-0", attrs: { "for": id } }, [_t("default")], 2)]);
    } }, data() { return { id: "file" + this._uid }; }, props: { accept: String, multiple: Boolean }, computed: { type() {
            // 已知 Safari 對於 accept 屬性的支援有問題
            return (navigator.vendor && navigator.vendor.startsWith("Apple")) ? "" : this.accept;
        } }, methods: { click() {
            this.$refs.lbl.click();
        } } });

Vue.component('design', { render() { with (this) {
        return _c('div', [_c('h5', { directives: [{ name: "t", rawName: "v-t", value: ('panel.design.type'), expression: "'panel.design.type'" }], staticClass: "panel-title" }), _v(" "), _c('field', { attrs: { "label": $t('panel.design.title'), "placeholder": $t('panel.design.titlePH') }, model: { value: (design.title), callback: function ($$v) { $set(design, "title", $$v); }, expression: "design.title" } }), _v(" "), _c('div', { staticClass: "mt-1 mb-4" }, [_c('textarea', { directives: [{ name: "model", rawName: "v-model", value: (design.description), expression: "design.description" }], staticClass: "form-control", attrs: { "rows": "4", "placeholder": $t('panel.design.descriptionPH') }, domProps: { "value": (design.description) }, on: { "input": function ($event) { if ($event.target.composing)
                            return; $set(design, "description", $event.target.value); } } })]), _v(" "), _c('div', { staticClass: "my-2" }, [(design.mode == 'tree') ? _c('h6', { directives: [{ name: "t", rawName: "v-t", value: ('panel.design.tree'), expression: "'panel.design.tree'" }] }) : _e(), _v(" "), (design.mode == 'layout') ? _c('h6', { directives: [{ name: "t", rawName: "v-t", value: ('panel.design.layout'), expression: "'panel.design.layout'" }] }) : _e()]), _v(" "), _c('number', { attrs: { "label": $t('panel.design.width'), "min": 8 }, model: { value: (design.sheet.width), callback: function ($$v) { $set(design.sheet, "width", _n($$v)); }, expression: "design.sheet.width" } }), _v(" "), _c('number', { attrs: { "label": $t('panel.design.height'), "min": 8 }, model: { value: (design.sheet.height), callback: function ($$v) { $set(design.sheet, "height", _n($$v)); }, expression: "design.sheet.height" } }), _v(" "), _c('number', { attrs: { "label": $t('panel.design.zoom'), "step": step, "min": 100 }, model: { value: (design.sheet.zoom), callback: function ($$v) { $set(design.sheet, "zoom", _n($$v)); }, expression: "design.sheet.zoom" } })], 1);
    } }, mixins: [BaseComponent], computed: { step() {
            let s = this.design.sheet.zoom;
            return (2 ** Math.floor(Math.log2(s / 100))) * 25;
        } } });

Vue.component('edge', { render() { with (this) {
        return _c('div', [_c('h5', { directives: [{ name: "t", rawName: "v-t", value: ('panel.edge.type'), expression: "'panel.edge.type'" }], staticClass: "panel-title" }), _v(" "), _c('number', { attrs: { "label": $t('panel.edge.length') }, model: { value: (selection.length), callback: function ($$v) { $set(selection, "length", _n($$v)); }, expression: "selection.length" } }), _v(" "), _c('div', { staticClass: "mt-3" }, [_c('button', { directives: [{ name: "t", rawName: "v-t", value: ('panel.edge.split'), expression: "'panel.edge.split'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return selection.split(); } } }), _v(" "), (selection.edge.isRiver) ? _c('button', { directives: [{ name: "t", rawName: "v-t", value: ('panel.edge.merge'), expression: "'panel.edge.merge'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return selection.deleteAndMerge(); } } }) : _c('button', { directives: [{ name: "t", rawName: "v-t", value: ('keyword.delete'), expression: "'keyword.delete'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return selection.delete(); } } })]), _v(" "), _c('div', { staticClass: "mt-3" }, [_c('button', { directives: [{ name: "t", rawName: "v-t", value: (selection.edge.isRiver ? 'panel.edge.goto' : 'panel.vertex.goto'), expression: "selection.edge.isRiver?'panel.edge.goto':'panel.vertex.goto'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return design.edgeToRiver(selection); } } })])], 1);
    } }, mixins: [BaseComponent] });

Vue.component('flap', { render() { with (this) {
        return _c('div', [_c('h5', { directives: [{ name: "t", rawName: "v-t", value: ('panel.flap.type'), expression: "'panel.flap.type'" }], staticClass: "panel-title" }), _v(" "), _c('field', { attrs: { "label": $t('panel.flap.name') }, model: { value: (selection.name), callback: function ($$v) { $set(selection, "name", $$v); }, expression: "selection.name" } }), _v(" "), _c('number', { attrs: { "label": $t('panel.flap.radius'), "min": 1 }, model: { value: (selection.radius), callback: function ($$v) { $set(selection, "radius", _n($$v)); }, expression: "selection.radius" } }), _v(" "), _c('number', { attrs: { "label": $t('panel.flap.width'), "max": design.sheet.width, "min": 0 }, model: { value: (selection.width), callback: function ($$v) { $set(selection, "width", _n($$v)); }, expression: "selection.width" } }), _v(" "), _c('number', { attrs: { "label": $t('panel.flap.height'), "max": design.sheet.height, "min": 0 }, model: { value: (selection.height), callback: function ($$v) { $set(selection, "height", _n($$v)); }, expression: "selection.height" } }), _v(" "), _c('div', { staticClass: "mt-3" }, [(design.tree.node.size > 3) ? _c('button', { directives: [{ name: "t", rawName: "v-t", value: ('keyword.delete'), expression: "'keyword.delete'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return design.deleteFlaps(selections); } } }, [_v("Delete")]) : _e()]), _v(" "), _c('div', { staticClass: "mt-3" }, [_c('button', { directives: [{ name: "t", rawName: "v-t", value: ('panel.flap.goto'), expression: "'panel.flap.goto'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return design.flapToVertex(selections); } } })])], 1);
    } }, mixins: [BaseComponent] });

Vue.component('flaps', { render() { with (this) {
        return _c('div', [_c('h5', { directives: [{ name: "t", rawName: "v-t", value: ('panel.flaps.type'), expression: "'panel.flaps.type'" }], staticClass: "panel-title" }), _v(" "), _c('div', { staticClass: "mt-3" }, [(design.tree.node.size > 3) ? _c('button', { directives: [{ name: "t", rawName: "v-t", value: ('keyword.delete'), expression: "'keyword.delete'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return design.deleteFlaps(selections); } } }) : _e()]), _v(" "), _c('div', { staticClass: "mt-3" }, [_c('button', { directives: [{ name: "t", rawName: "v-t", value: ('panel.flaps.goto'), expression: "'panel.flaps.goto'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return design.flapToVertex(selections); } } })])]);
    } }, mixins: [BaseComponent] });

Vue.component('panel', { render() { with (this) {
        return _c('div', { ref: "panel", staticClass: "scroll-shadow", class: { 'show': show }, attrs: { "id": "divPanel" }, on: { "contextmenu": function ($event) { $event.stopPropagation(); return onContextMenu($event); } } }, [(design) ? [(selections.length == 0) ? _c('design', { key: design.sheet.guid }) : (selections.length == 1) ? _c('div', { key: selection.guid }, [(repository) ? _c('repository', { attrs: { "repository": repository } }) : _c(selection.type.toLowerCase(), { tag: "component" })], 1) : _c('div', [(selection.type == 'Flap') ? _c('flaps') : _e(), _v(" "), (selection.type == 'Vertex') ? _c('vertices') : _e()], 1)] : _e()], 2);
    } }, mixins: [BaseComponent], props: { show: Boolean }, watch: { "repository"() { }, "design.mode"() {
            let el = document.activeElement;
            if (el && this.$refs.panel.contains(el))
                el.blur();
        } }, computed: { repository() {
            let s = this.selection;
            if (!s)
                return null;
            if (s.type == "Device")
                return s.pattern.configuration.repository;
            if (s.type == "Stretch")
                return s.repository;
            return null;
        } }, methods: { onContextMenu(event) {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) { }
            else
                event.preventDefault();
        } } });

Vue.component('repository', { render() { with (this) {
        return _c('div', [_c('h5', { directives: [{ name: "t", rawName: "v-t", value: ('panel.repo.type'), expression: "'panel.repo.type'" }], staticClass: "panel-title" }), _v(" "), (repository.size > 1) ? _c('store', { attrs: { "data": repository, "label": $t('panel.repo.config') } }) : _e(), _v(" "), (repository.entry.size > 1) ? _c('store', { attrs: { "data": repository.entry, "label": $t('panel.repo.pattern') } }) : (repository.size == 1) ? _c('div', { staticClass: "row" }, [_c('label', { directives: [{ name: "t", rawName: "v-t", value: ('panel.repo.onlyOne'), expression: "'panel.repo.onlyOne'" }], staticClass: "col-form-label col" })]) : _e()], 1);
    } }, props: { repository: Object } });

Vue.component('river', { render() { with (this) {
        return _c('div', [_c('h5', { directives: [{ name: "t", rawName: "v-t", value: ('panel.river.type'), expression: "'panel.river.type'" }], staticClass: "panel-title" }), _v(" "), _c('number', { attrs: { "label": $t('panel.river.width'), "min": 0 }, model: { value: (selection.length), callback: function ($$v) { $set(selection, "length", _n($$v)); }, expression: "selection.length" } }), _v(" "), _c('div', { staticClass: "mt-3" }, [_c('button', { directives: [{ name: "t", rawName: "v-t", value: ('keyword.delete'), expression: "'keyword.delete'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return selection.delete(); } } })]), _v(" "), _c('div', { staticClass: "mt-3" }, [_c('button', { directives: [{ name: "t", rawName: "v-t", value: ('panel.river.goto'), expression: "'panel.river.goto'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return design.riverToEdge(selection); } } })])], 1);
    } }, mixins: [BaseComponent] });

Vue.component('vertex', { render() { with (this) {
        return _c('div', [_c('h5', { directives: [{ name: "t", rawName: "v-t", value: ('panel.vertex.type'), expression: "'panel.vertex.type'" }], staticClass: "panel-title" }), _v(" "), _c('field', { attrs: { "label": $t('panel.vertex.name') }, model: { value: (selection.name), callback: function ($$v) { $set(selection, "name", $$v); }, expression: "selection.name" } }), _v(" "), _c('div', { staticClass: "mt-3 d-flex", staticStyle: { "flex-wrap": "wrap" } }, [_c('button', { directives: [{ name: "t", rawName: "v-t", value: ('panel.vertex.addLeaf'), expression: "'panel.vertex.addLeaf'" }], staticClass: "btn btn-primary flex-shrink-0", on: { "click": function ($event) { return selection.addLeaf(newLength); } } }), _v(" "), _c('div', { staticClass: "flex-grow-1 d-flex justify-content-end", staticStyle: { "flex-basis": "150px" } }, [_c('label', { staticClass: "col-form-label mx-2 flex-shrink-0" }, [_v(_s($t('panel.vertex.ofLength')))]), _v(" "), _c('div', { staticClass: "flex-grow-1", staticStyle: { "max-width": "130px" } }, [_c('number', { attrs: { "min": 1 }, model: { value: (newLength), callback: function ($$v) { newLength = $$v; }, expression: "newLength" } })], 1)])]), _v(" "), (design.tree.node.size > 3) ? _c('div', { staticClass: "mt-3" }, [(selection.degree == 1) ? _c('button', { directives: [{ name: "t", rawName: "v-t", value: ('keyword.delete'), expression: "'keyword.delete'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return selection.delete(); } } }) : _e(), _v(" "), (selection.degree == 2) ? _c('button', { directives: [{ name: "t", rawName: "v-t", value: ('panel.vertex.delJoin'), expression: "'panel.vertex.delJoin'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return selection.deleteAndJoin(); } } }) : _e()]) : _e(), _v(" "), (selection.degree == 1) ? _c('div', { staticClass: "mt-3" }, [_c('button', { directives: [{ name: "t", rawName: "v-t", value: ('panel.vertex.goto'), expression: "'panel.vertex.goto'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return design.vertexToFlap(selections); } } })]) : _e()], 1);
    } }, mixins: [BaseComponent], data() { return { newLength: 1 }; } });

Vue.component('vertices', { render() { with (this) {
        return _c('div', [_c('h5', { directives: [{ name: "t", rawName: "v-t", value: ('panel.vertices.type'), expression: "'panel.vertices.type'" }], staticClass: "panel-title" }), _v(" "), (selections.some(s => s.degree == 1)) ? _c('div', [(design.vertices.size > 3) ? _c('button', { directives: [{ name: "t", rawName: "v-t", value: ('keyword.delete'), expression: "'keyword.delete'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return design.deleteVertices(selections); } } }) : _c('span', { directives: [{ name: "t", rawName: "v-t", value: ('message.min3vertex'), expression: "'message.min3vertex'" }] })]) : _e(), _v(" "), _c('div', { staticClass: "mt-3" }, [_c('button', { directives: [{ name: "t", rawName: "v-t", value: ('panel.vertices.goto'), expression: "'panel.vertices.goto'" }], staticClass: "btn btn-primary", on: { "click": function ($event) { return design.vertexToFlap(selections); } } })])]);
    } }, mixins: [BaseComponent] });

Vue.component('editmenu', { render() { with (this) {
        return _c('dropdown', { attrs: { "icon": "bp-pencil-ruler", "title": $t('toolbar.edit.title') } }, [_c('dropdownitem', { attrs: { "disabled": !design || !design.history.canUndo }, on: { "click": undo } }, [_c('hotkey', { attrs: { "icon": "bp-undo", "ctrl": "", "hk": "Z" } }, [_v(_s($t('toolbar.edit.undo')))])], 1), _v(" "), _c('dropdownitem', { attrs: { "disabled": !design || !design.history.canRedo }, on: { "click": redo } }, [_c('hotkey', { attrs: { "icon": "bp-redo", "ctrl": "", "hk": "Y" } }, [_v(_s($t('toolbar.edit.redo')))])], 1), _v(" "), _c('divider'), _v(" "), _c('dropdownitem', { attrs: { "disabled": !design }, on: { "click": selectAll } }, [_c('hotkey', { attrs: { "icon": "fas fa-th", "ctrl": "", "hk": "A" } }, [_v(_s($t('toolbar.edit.selectAll')))])], 1)], 1);
    } }, mixins: [BaseComponent], methods: { undo() {
            if (this.design)
                this.design.history.undo();
        }, redo() {
            if (this.design)
                this.design.history.redo();
        }, selectAll() {
            if (this.design)
                this.design.selectAll();
        } }, mounted() {
        registerHotkey(() => this.undo(), "z");
        registerHotkey(() => this.redo(), "y");
        registerHotkey(() => this.redo(), "z", true);
        registerHotkey(() => this.selectAll(), "a");
    } });

Vue.component('filemenu', { render() { with (this) {
        return _c('dropdown', { attrs: { "icon": "bp-file-alt", "title": $t('toolbar.file.title') }, on: { "hide": reset } }, [_c('div', { staticClass: "dropdown-item", on: { "click": newProject } }, [_c('i', { staticClass: "far fa-file" }), _v("\n\t\t" + _s($t('toolbar.file.new')) + "\n\t")]), _v(" "), _c('divider'), _v(" "), _c('uploader', { ref: "open", attrs: { "accept": ".bps, .bpz, .json, .zip", "multiple": "" }, on: { "upload": function ($event) { return upload($event); } } }, [_c('hotkey', { attrs: { "icon": "far fa-folder-open", "ctrl": "", "hk": "O" } }, [_v(_s($t('toolbar.file.open')))])], 1), _v(" "), _c('download', { ref: "bps", attrs: { "disabled": !design, "file": jsonFile }, on: { "download": notify } }, [_c('hotkey', { attrs: { "icon": "fas fa-download", "ctrl": "", "hk": "S" } }, [_v(_s($t('toolbar.file.saveBPS')))])], 1), _v(" "), _c('download', { ref: "bpz", attrs: { "disabled": !design, "file": workspaceFile }, on: { "download": notifyAll } }, [_c('hotkey', { attrs: { "icon": "fas fa-download", "ctrl": "", "shift": "", "hk": "S" } }, [_v(_s($t('toolbar.file.saveBPZ')))])], 1), _v(" "), _c('divider'), _v(" "), _c('download', { ref: "svg", attrs: { "disabled": !design, "file": svgFile }, on: { "download": svgSaved } }, [_c('i', { staticClass: "far fa-file-image" }), _v("\n\t\t" + _s($t('toolbar.file.saveSVG')) + "\n\t")]), _v(" "), _c('download', { ref: "png", attrs: { "disabled": !design, "file": pngFile }, on: { "download": pngSaved } }, [_c('i', { staticClass: "far fa-file-image" }), _v("\n\t\t" + _s($t('toolbar.file.savePNG')) + "\n\t")]), _v(" "), (copyEnabled) ? _c('dropdownitem', { attrs: { "disabled": !design }, on: { "click": copyPNG } }, [_c('i', { staticClass: "far fa-copy" }), _v("\n\t\t" + _s($t('toolbar.file.copyPNG')) + "\n\t")]) : _e(), _v(" "), _c('divider'), _v(" "), _c('dropdownitem', { attrs: { "disabled": !design }, on: { "click": print } }, [_c('hotkey', { attrs: { "icon": "fas fa-print", "ctrl": "", "hk": "P" } }, [_v(_s($t('toolbar.file.print')))])], 1), _v(" "), _c('dropdownitem', { attrs: { "disabled": !design }, on: { "click": function ($event) { return $emit('share'); } } }, [_c('i', { staticClass: "fas fa-share-alt" }), _v("\n\t\t" + _s($t('toolbar.file.share')) + "\n\t")])], 1);
    } }, mixins: [BaseComponent], computed: { jsonFile() {
            return !this.design ?
                { name: "", content: () => "" } :
                { name: sanitize(this.design.title) + ".bps", content: () => bp.toBPS() };
        }, svgFile() {
            return !this.design ?
                { name: "", content: () => "" } :
                { name: sanitize(this.design.title) + ".svg", content: () => bp.$display.toSVG() };
        }, pngFile() {
            return !this.design ?
                { name: "", content: () => "" } :
                { name: sanitize(this.design.title) + ".png", content: () => bp.$display.toPNG() };
        }, workspaceFile() {
            return !core.designs.length ?
                { name: "", content: () => "" } :
                { name: this.$t('keyword.workspace') + ".bpz", content: () => core.zip() };
        }, copyEnabled() {
            return navigator.clipboard && 'write' in navigator.clipboard;
        } }, methods: { newProject() {
            core.create();
            gtag('event', 'project_create');
        }, notify() {
            bp.design.history.notifySave();
            gtag('event', 'project_bps');
        }, notifyAll() {
            bp.designMap.forEach(d => d.history.notifySave());
            gtag('event', 'project_bpz');
        }, svgSaved() {
            gtag('event', 'project_svg');
        }, pngSaved() {
            gtag('event', 'project_png');
        }, copyPNG() {
            bp.$display.copyPNG();
            gtag('event', 'share', { method: 'copy', content_type: 'image' });
        }, reset() {
            // 當選單關閉的時候把所有 ObjectURL 回收掉
            this.$refs.bps.reset();
            this.$refs.bpz.reset();
            this.$refs.svg.reset();
            this.$refs.png.reset();
        }, async upload(event) {
            let f = event.target;
            await core.loader.show();
            await this.openFiles(f.files);
            f.value = ""; // 重新設定；否則再次開啟相同檔案時會沒有反應
            gtag('event', 'project_open');
            core.loader.hide();
            core.select(core.designs[core.designs.length - 1]);
        }, async openFiles(files) {
            if (files.length)
                for (let i = 0; i < files.length; i++)
                    await this.open(files[i]);
        }, async open(file) {
            try {
                let buffer = await readFile(file);
                let test = String.fromCharCode.apply(null, new Uint8Array(buffer.slice(0, 1)));
                if (test == "{") { // JSON
                    core.addDesign(bp.load(bufferToText(buffer)));
                }
                else if (test == "P") { // PKZip
                    await this.openWorkspace(buffer);
                }
                else
                    throw 1;
            }
            catch (e) {
                debugger;
                await core.alert(this.$t('message.invalidFormat', [file.name]));
            }
        }, async openWorkspace(buffer) {
            let zip = await JSZip.loadAsync(buffer);
            let files = [];
            zip.forEach(path => files.push(path));
            for (let f of files) {
                try {
                    let data = await zip.file(f).async("text");
                    core.addDesign(bp.load(data));
                }
                catch (e) {
                    debugger;
                    await core.alert(this.$t('message.invalidFormat', [f]));
                }
            }
        }, print() {
            if (!core.design)
                return;
            bp.$display.beforePrint();
            setTimeout(window.print, 500);
            gtag('event', 'print', {});
        } }, mounted() {
        document.body.addEventListener('dragover', e => {
            e.preventDefault();
            e.stopPropagation();
        });
        document.body.addEventListener("drop", e => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer)
                this.openFiles(e.dataTransfer.files);
        });
        registerHotkey(() => this.$refs.open.click(), "o");
        registerHotkey(() => core.design && this.$refs.bps.download(), "s");
        registerHotkey(() => core.design && this.$refs.bpz.download(), "s", true);
        registerHotkey(() => this.print(), "p");
    } });

Vue.component('fullscreen', { render() { with (this) {
        return _c('div', { directives: [{ name: "show", rawName: "v-show", value: (fullscreenEnabled), expression: "fullscreenEnabled" }], staticClass: "browser-only" }, [_c('div', { staticClass: "dropdown-item", on: { "click": toggleFullscreen } }, [_c('i', { staticClass: "fas fa-expand" }), _v("\n\t\t" + _s($t('toolbar.setting.fullscreen' + (fullscreen ? 'Exit' : ''))) + "\n\t")]), _v(" "), _c('divider')], 1);
    } }, data() {
        return { fullscreen: false, fullscreenEnabled: document.fullscreenEnabled ||
                document.mozFullscreenEnabled || document.webkitFullscreenEnabled };
    }, methods: { checkFullscreen() {
            this.fullscreen = window.matchMedia('(display-mode: fullscreen)').matches
                || !!document.fullscreenElement
                || !!document.mozFullScreenElement
                || !!document.webkitCurrentFullScreenElement;
        }, toggleFullscreen() {
            if (this.fullscreen) {
                let doc = document;
                (doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen).apply(doc);
            }
            else {
                let el = document.documentElement;
                (el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen).apply(el);
            }
        } }, created() {
        document.addEventListener('fullscreenchange', () => this.checkFullscreen());
        document.addEventListener('mozfullscreenchange', () => this.checkFullscreen()); // Firefox < 64
        document.addEventListener('webkitfullscreenchange', () => this.checkFullscreen()); // Safari
    } });

Vue.component('settingmenu', { render() { with (this) {
        return _c('dropdown', { attrs: { "icon": "bp-tasks", "title": $t('toolbar.setting.title') } }, [_c('fullscreen'), _v(" "), _c('div', { staticClass: "dropdown-item", on: { "click": function ($event) { return toggle('showGrid'); } } }, [(!settings.showGrid) ? _c('i') : _c('i', { staticClass: "fas fa-grip-lines text-secondary" }), _v("\n\t\t" + _s($t('toolbar.setting.grid')) + "\n\t")]), _v(" "), _c('div', { staticClass: "dropdown-item", on: { "click": function ($event) { return toggle('showHinge'); } } }, [(!settings.showHinge) ? _c('i') : _c('i', { staticClass: "fas fa-grip-lines text-primary" }), _v("\n\t\t" + _s($t('toolbar.setting.hinge')) + "\n\t")]), _v(" "), _c('div', { staticClass: "dropdown-item", on: { "click": function ($event) { return toggle('showRidge'); } } }, [(!settings.showRidge) ? _c('i') : _c('i', { staticClass: "fas fa-grip-lines text-danger" }), _v("\n\t\t" + _s($t('toolbar.setting.ridge')) + "\n\t")]), _v(" "), _c('div', { staticClass: "dropdown-item", on: { "click": function ($event) { return toggle('showAxialParallel'); } } }, [(!settings.showAxialParallel) ? _c('i') : _c('i', { staticClass: "fas fa-grip-lines text-success" }), _v("\n\t\t" + _s($t('toolbar.setting.axial')) + "\n\t")]), _v(" "), _c('div', { staticClass: "dropdown-item", on: { "click": function ($event) { return toggle('showLabel'); } } }, [(!settings.showLabel) ? _c('i') : _c('i', { staticClass: "fas fa-font" }), _v("\n\t\t" + _s($t('toolbar.setting.label')) + "\n\t")]), _v(" "), _c('div', { staticClass: "dropdown-item", on: { "click": function ($event) { return toggle('showDot'); } } }, [(!settings.showDot) ? _c('i') : _c('i', { staticClass: "fas fa-genderless" }), _v("\n\t\t" + _s($t('toolbar.setting.tip')) + "\n\t")]), _v(" "), _c('div', { staticClass: "touch-only" }, [_c('divider'), _v(" "), _c('div', { staticClass: "dropdown-item", on: { "click": function ($event) { return toggle('showDPad', core); } } }, [(!core.showDPad) ? _c('i') : _c('i', { staticClass: "fas fa-arrows-alt" }), _v("\n\t\t\t" + _s($t('toolbar.setting.dPad')) + "\n\t\t")])], 1), _v(" "), _c('divider'), _v(" "), _c('div', { staticClass: "dropdown-item", on: { "click": function ($event) { return $emit('pref'); } } }, [_c('i', { staticClass: "fas fa-cog" }), _v("\n\t\t" + _s($t('toolbar.setting.preference')) + "\n\t")])], 1);
    } }, mixins: [BaseComponent], computed: { core() { return core; }, settings() {
            return core.initialized ? bp.$display.settings : {};
        } }, methods: { toggle(key, target) {
            if (!target)
                target = this.settings;
            target[key] = !target[key];
            core.saveSettings();
            if (key == "showDPad")
                gtag('event', 'dpad_' + (target[key] ? "on" : "off"));
        } } });

Vue.component('toolbar', { render() { with (this) {
        return _c('div', { staticClass: "btn-toolbar p-2", attrs: { "id": "divToolbar" } }, [_c('div', { staticClass: "btn-group me-2" }, [_c('filemenu', { on: { "share": function ($event) { return $emit('share'); } } }), _v(" "), _c('editmenu'), _v(" "), _c('settingmenu', { on: { "pref": function ($event) { return $emit('pref'); } } }), _v(" "), _c('dropdown', { attrs: { "icon": "bp-tools", "title": $t('toolbar.tools.title') } }, [_c('uploader', { attrs: { "accept": ".tmd5" }, on: { "upload": function ($event) { return TreeMaker($event); } } }, [_c('i', { staticClass: "fas fa-file-import" }), _v("\n\t\t\t\t" + _s($t("toolbar.tools.TreeMaker")) + "\n\t\t\t")])], 1), _v(" "), _c('dropdown', { attrs: { "icon": "bp-question-circle", "title": $t('toolbar.help.title'), "notify": notify || core.updated } }, [_c('div', { staticClass: "dropdown-item", on: { "click": function ($event) { return $emit('about'); } } }, [_c('i', { staticClass: "bp-info" }), _v("\n\t\t\t\t" + _s($t('toolbar.help.about')) + "\n\t\t\t")]), _v(" "), _c('div', { staticClass: "dropdown-item", on: { "click": news } }, [_c('i', { staticClass: "fas fa-newspaper" }), _v("\n\t\t\t\t" + _s($t('toolbar.help.news')) + "\n\t\t\t\t"), (notify) ? _c('div', { staticClass: "notify" }) : _e()]), _v(" "), _c('a', { staticClass: "dropdown-item", attrs: { "href": "https://github.com/MuTsunTsai/box-pleating-studio/discussions", "target": "_blank", "rel": "noopener" } }, [_c('i', { staticClass: "far fa-comment-dots" }), _v("\n\t\t\t\t" + _s($t("toolbar.help.discussions")) + "\n\t\t\t")]), _v(" "), _c('a', { staticClass: "dropdown-item", attrs: { "href": "https://github.com/MuTsunTsai/box-pleating-studio/issues", "target": "_blank", "rel": "noopener" } }, [_c('i', { staticClass: "fas fa-bug" }), _v("\n\t\t\t\t" + _s($t("toolbar.help.issue")) + "\n\t\t\t")]), _v(" "), _c('divider'), _v(" "), (core.updated) ? _c('div', { staticClass: "dropdown-item", on: { "click": update } }, [_c('i', { staticClass: "far fa-arrow-alt-circle-up" }), _v("\n\t\t\t\t" + _s($t('toolbar.help.update')) + "\n\t\t\t\t"), _c('div', { staticClass: "notify" })]) : _c('div', { staticClass: "dropdown-item", on: { "click": checkUpdate } }, [_c('i', { staticClass: "far fa-arrow-alt-circle-up" }), _v("\n\t\t\t\t" + _s($t('toolbar.help.checkUpdate')) + "\n\t\t\t")]), _v(" "), _c('divider'), _v(" "), _c('a', { staticClass: "dropdown-item", attrs: { "href": "donate.htm", "target": "_blank", "rel": "noopener" } }, [_c('i', { staticClass: "fas fa-hand-holding-usd" }), _v("\n\t\t\t\t" + _s($t('toolbar.help.donation')) + "\n\t\t\t")])], 1)], 1), _v(" "), _c('div', { staticClass: "btn-group me-2" }, [_c('button', { staticClass: "btn btn-primary", class: { active: design && design.mode == 'tree' }, attrs: { "type": "button", "title": $t('toolbar.view.tree'), "disabled": !design }, on: { "click": toTree } }, [_c('i', { staticClass: "bp-tree" })]), _v(" "), _c('button', { staticClass: "btn btn-primary", class: { active: design && design.mode == 'layout' }, attrs: { "type": "button", "title": $t('toolbar.view.layout'), "disabled": !design }, on: { "click": toLayout } }, [_c('i', { staticClass: "bp-layout" })])]), _v(" "), (ready) ? _c('div', { ref: "tab", staticClass: "flex-grow-1", attrs: { "id": "divTab" }, on: { "wheel": function ($event) { return tabWheel($event); } } }, [_c('draggable', _b({ model: { value: (core.designs), callback: function ($$v) { $set(core, "designs", $$v); }, expression: "core.designs" } }, 'draggable', dragOption, false), _l((core.designs), function (id) { return _c('div', { key: id, staticClass: "tab", class: { active: design == getDesign(id) }, attrs: { "id": `tab${id}` }, on: { "click": function ($event) { return core.select(id); } } }, [_c('div', { staticClass: "tab-close", attrs: { "title": getDesign(id).title }, on: { "contextmenu": function ($event) { return tabMenu($event, id); } } }, [_c('div', [(getDesign(id).history.modified) ? _c('span', [_v("*")]) : _e(), _v("\n\t\t\t\t\t\t" + _s(getTitle(id)) + "\n\t\t\t\t\t")]), _v(" "), _c('div', { staticClass: "px-2", on: { "click": function ($event) { $event.stopPropagation(); return core.close(id); }, "pointerdown": function ($event) { $event.stopPropagation(); }, "mousedown": function ($event) { $event.stopPropagation(); } } }, [_c('i', { staticClass: "fas fa-times" })])]), _v(" "), _c('div', { staticClass: "tab-down", attrs: { "title": getDesign(id).title } }, [_c('div', [(getDesign(id).history.modified) ? _c('span', [_v("*")]) : _e(), _v("\n\t\t\t\t\t\t" + _s(getTitle(id)) + "\n\t\t\t\t\t")]), _v(" "), _c('div', { staticClass: "px-2", on: { "click": function ($event) { $event.stopPropagation(); return tabMenu($event, id); }, "pointerdown": function ($event) { $event.stopPropagation(); }, "touchstart": function ($event) { $event.stopPropagation(); } } }, [_c('i', { staticClass: "fas fa-caret-down" })])])]); }), 0)], 1) : _c('div', { staticClass: "flex-grow-1", attrs: { "id": "divTab" } }), _v(" "), _c('contextmenu', { ref: "tabMenu" }, [_c('div', { staticClass: "dropdown-item", on: { "click": function ($event) { return core.clone(menuId); } } }, [_c('i', { staticClass: "far fa-clone" }), _v("\n\t\t\t" + _s($t('toolbar.tab.clone')) + "\n\t\t")]), _v(" "), _c('divider'), _v(" "), _c('div', { staticClass: "dropdown-item", on: { "click": function ($event) { return core.close(menuId); } } }, [_c('i', { staticClass: "far fa-window-close" }), _v("\n\t\t\t" + _s($t('toolbar.tab.close')) + "\n\t\t")]), _v(" "), _c('div', { staticClass: "dropdown-item", on: { "click": function ($event) { return core.closeOther(menuId); } } }, [_c('i', { staticClass: "far fa-window-close" }), _v("\n\t\t\t" + _s($t('toolbar.tab.closeOther')) + "\n\t\t")]), _v(" "), _c('div', { staticClass: "dropdown-item", on: { "click": function ($event) { return core.closeRight(menuId); } } }, [_c('i', { staticClass: "far fa-window-close" }), _v("\n\t\t\t" + _s($t('toolbar.tab.closeRight')) + "\n\t\t")]), _v(" "), _c('div', { staticClass: "dropdown-item", on: { "click": function ($event) { return core.closeAll(); } } }, [_c('i', { staticClass: "far fa-window-close" }), _v("\n\t\t\t" + _s($t('toolbar.tab.closeAll')) + "\n\t\t")])], 1), _v(" "), _c('div', { staticClass: "btn-group", attrs: { "id": "panelToggle" } }, [_c('button', { staticClass: "btn btn-primary", attrs: { "type": "button", "title": $t('toolbar.panel'), "disabled": !design }, on: { "click": function ($event) { return $emit('panel'); } } }, [_c('i', { staticClass: "bp-sliders-h" })])])], 1);
    } }, mixins: [BaseComponent], data() { return { notify: undefined, ready: false, menuId: undefined }; }, computed: { dragOption() {
            return {
                delay: 500,
                delayOnTouchOnly: true,
                touchStartThreshold: 20,
                animation: 200,
                forceFallback: true,
                direction: "horizontal",
                scroll: true
            };
        }, core() { return core; } }, methods: { async update() {
            if (await core.confirm(this.$t("message.updateReady")))
                location.reload();
        }, async checkUpdate() {
            let reg = await navigator.serviceWorker.ready;
            let cb = () => this.update();
            reg.addEventListener("updatefound", cb, { once: true });
            await reg.update();
            if (!reg.installing && !reg.waiting) {
                reg.removeEventListener("updatefound", cb);
                await core.alert(this.$t("message.latest"));
            }
        }, news() {
            if (this.notify) {
                localStorage.setItem("last_log", logs[logs.length - 1].toString());
                this.notify = false;
            }
            this.$emit('news');
        }, toLayout() { this.design.mode = "layout"; }, toTree() { this.design.mode = "tree"; }, tabWheel(event) {
            if (event.deltaX == 0) {
                this.$refs.tab.scrollLeft -= event.deltaY / 5;
            }
        }, async TreeMaker(event) {
            let f = event.target;
            if (f.files.length == 0)
                return;
            let content = bufferToText(await readFile(f.files[0]));
            let name = f.files[0].name;
            try {
                core.open(bp.TreeMaker.parse(name.replace(/\.tmd5$/i, ""), content));
            }
            catch (e) {
                core.alert(this.$t(e.message, [name]));
            }
            f.value = "";
        }, tabMenu(event, id) {
            this.menuId = id;
            this.$refs.tabMenu.show(event);
        }, getDesign(id) {
            return bp.designMap.get(id);
        }, getTitle(id) {
            let title = this.getDesign(id).title;
            return title ? title : this.$t('toolbar.project.noTitle');
        } }, mounted() {
        let v = parseInt(localStorage.getItem("last_log") || "0");
        this.notify = v < logs[logs.length - 1];
        core.libReady.then(() => this.ready = true);
    } });


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
 }