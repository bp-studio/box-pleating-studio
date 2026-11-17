
const GITHUB = "https://github.com/bp-studio/box-pleating-studio/issues";
const DISCORD = "https://discord.gg/zS4FPxHwHX";

function link(href: string, text: string): string {
	return `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
}

//=================================================================
/**
 * Localized versions of the startup error messages, which are written in
 * English in index.htm (as i18n might not be available when the error occurs).
 * The structures here must match those in index.htm.
 */
//=================================================================
const startupError = {
	requirement(): string {
		return `<h3>${i18n.t("message.startup.title")}</h3>` +
			`<div class="mt-2">${i18n.t("message.startup.causes")}<ol>` +
			`<li>${i18n.t("message.startup.outdated")}<br>` +
			`${i18n.t("message.startup.outdatedBody")}</li>` +
			`<li>${i18n.t("message.startup.bug")}<br>` +
			`${i18n.t("message.startup.bugBody")}</li>` +
			`</ol>${i18n.t("message.startup.reported")}<br>` +
			i18n.t("message.startup.report", [link(GITHUB, "GitHub"), link(DISCORD, "Discord")]) +
			"</div>";
	},
	resource(): string {
		return `<h3>${i18n.t("message.resource.title")}</h3>` +
			`<div class="mt-2">${i18n.t("message.resource.body")}<br><br>` +
			`${i18n.t("message.resource.failed")}</div>`;
	},
};

/**
 * Registers the global `startupError` object, which is checked by the error
 * manager in index.htm. This must be called after the locale is settled.
 */
export function registerStartupError(): void {
	if("startupError" in window) return;
	Object.defineProperty(window, "startupError", {
		writable: false,
		value: startupError,
	});
	// In case that the error has been shown before the registration.
	errMgr.localize();
}
