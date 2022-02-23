
//=================================================================
/**
 * {@link DarkController} 是監測黑暗偏好狀態的控制器，
 * 其原理是根據 `<html>` 元件是否有 `dark` 的 class
 * （這個東西會在其它部份的程式碼中被設置）
 */
//=================================================================

@shrewd export class DarkController {

	// 這個不能一開始就初始化，否則 @shrewd 不會發生作用
	private static _instance: DarkController;

	public static get $dark(): boolean {
		DarkController._instance ??= new DarkController();
		return DarkController._instance._dark;
	}

	private constructor() {
		const html = document.documentElement;
		this._dark = html.classList.contains('dark');

		const observer = new MutationObserver(() => {
			this._dark = html.classList.contains('dark');
		});

		observer.observe(html, {
			attributes: true,
			attributeFilter: ['class'],
			childList: false,
			characterData: false,
		});
	}

	@shrewd private _dark: boolean = false;
}
