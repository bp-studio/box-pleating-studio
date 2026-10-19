import { isInApp, isLowEndDevice, isOnline, isTouch } from "app/shared/constants";

import type { CoreError, DeviceInfo, JProject } from "shared/json/project";

const LOG_FILENAME_LENGTH = 20;
const JSON_INDENT = 4;
const MB = 1048576;

/**
 * Collect information about the device for diagnosing performance issues.
 * @param projects The number of opened projects.
 */
export function getDeviceInfo(projects: number): DeviceInfo {
	// The following are undefined in unsupported browsers, which is fine.
	/* eslint-disable compat/compat */
	const memory = performance.memory;
	const deviceMemory = navigator.deviceMemory;
	const concurrency = navigator.hardwareConcurrency;
	/* eslint-enable compat/compat */
	return {
		userAgent: navigator.userAgent,
		deviceMemory,
		concurrency,
		lowEnd: isLowEndDevice,
		touch: isTouch,
		inApp: Boolean(isInApp),
		screen: {
			width: screen.width,
			height: screen.height,
			pixelRatio: devicePixelRatio,
		},
		viewport: { width: innerWidth, height: innerHeight },
		gpu: getGpu(),
		heap: memory && {
			used: Math.round(memory.usedJSHeapSize / MB),
			limit: Math.round(memory.jsHeapSizeLimit / MB),
		},
		uptime: Math.round(performance.now()),
		projects,
		visible: document.visibilityState == "visible",
		focused: document.hasFocus(),
	};
}

/** Use a temporary context to avoid interfering with the rendering. */
function getGpu(): string | undefined {
	try {
		const gl = document.createElement("canvas").getContext("webgl");
		if(!gl) return undefined;
		const ext = gl.getExtension("WEBGL_debug_renderer_info");
		const result = String(gl.getParameter(
			ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER
		));
		gl.getExtension("WEBGL_lose_context")?.loseContext();
		return result;
	} catch {
		return undefined;
	}
}

/** @see [error.php](../../other/php/error.php) */
const WEBHOOK = "https://abstreamace.com/php-tool/bpstudio/error.php";

/**
 * Submit the fatal error report to Discord webhook.
 *
 * To test the functionality, paste and run the following in the console:
 * ```js
 * (function() {
 * 	const WEBHOOK = "https://abstreamace.com/php-tool/bpstudio/error.php";
 * 	const jsonBlob = new Blob(
 * 		[JSON.stringify({ data: "test file" })], { type: "application/json" }
 * 	);
 * 	const formData = new FormData();
 * 	formData.append("payload_json", JSON.stringify({ content: `Test` }));
 * 	formData.append("file", jsonBlob, `test.json`);
 * 	fetch(WEBHOOK, { method: "POST", body: formData });
 * })()
 * ```
 */
export async function uploadLog(
	log: JProject, error: CoreError
): Promise<void> {
	// Comment the next line to test fatal error reporting.
	if(!isOnline) return;

	try {
		const err_short = (error.message.match(/^[a-z ]+/i)?.[0] ?? "")
			.replace(/\s/g, "-")
			.substring(0, LOG_FILENAME_LENGTH);

		const trace = `Client trace:\n${block(error.clientTrace)}\nCore trace:\n${block(error.coreTrace)}`;
		const payload = {
			content: `A fatal error has occurred in BP Studio: **${error.message}**\n\n${getInfo(error.device)}\n\n${trace}\nFull log:`,
		};
		const jsonBlob = new Blob([JSON.stringify(log, null, JSON_INDENT)], { type: "application/json" });
		const formData = new FormData();
		formData.append("payload_json", JSON.stringify(payload));
		formData.append("file", jsonBlob, `${app_config.app_version}-${err_short}.json`);

		await fetch(WEBHOOK, {
			// Note that this won't work with `file://` protocol somehow
			method: "POST",
			body: formData,
		});
	} catch(e) {
		// ignore any error here.
	}
	gtag("event", "fatal_error", gaErrorData(error.message + "\n" + error.coreTrace));
}

function getInfo(device: DeviceInfo): string {
	let info = `User agent: ${device.userAgent}`;
	if(device.deviceMemory) info += `\nDevice memory: ${device.deviceMemory}`;
	if(device.concurrency) info += `\nConcurrency: ${device.concurrency}`;
	if(device.gpu) info += `\nGPU: ${device.gpu}`;
	return info;
}

function block(str: string): string {
	return "```\n" + str + "\n```";
}
