
//=================================================================
/**
 * {@link LibService} 服務負責管理非關鍵程式庫的載入
 */
//=================================================================
namespace LibService {

	let libResolve: Action;

	/** 等候所有非關鍵程式庫成功載入完畢 */
	export const ready: Promise<void> = new Promise<void>(resolve => {
		libResolve = resolve;
	});

	/** 載入非關鍵程式庫 */
	export function load(): Promise<void> {
		const loading = [];
		for(const lib of libs) {
			if(lib.endsWith("js")) loading.push(loadScript(lib));
			else loading.push(loadStylesheet(lib));
		}
		return Promise.all(loading).then(libResolve);
	}

	function loadStylesheet(href: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = href;
			link.onload = () => resolve();
			link.onerror = () => {
				errMgr.resErr ??= href;
				reject();
			};
			document.head.appendChild(link);
		});
	}

	export function loadScript(src: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const script = document.createElement("script");
			script.src = src;
			script.async = false;
			script.onload = () => resolve(); // 此時 script 內部的程式碼也已經執行完畢了
			script.onerror = () => {
				errMgr.resErr ??= src;
				reject();
			};
			document.head.appendChild(script);
		});
	}
}

export default LibService;
