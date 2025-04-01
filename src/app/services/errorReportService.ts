import { isOnline } from "app/shared/constants";

import type { CoreError, JProject } from "shared/json/project";

const LOG_FILENAME_LENGTH = 20;
const JSON_INDENT = 4;

const WEBHOOK = "https://discord.com/api/webhooks/1356479295622742096/CJ975w-YJG-THl3HDK0YZRoYNl_BpNHe4qTepO3tL4NX4b42oD9spaPcV1KTodpG5j0B";

declare global {
	interface Navigator {
		/**
		 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
		 */
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		readonly deviceMemory?: 0.25 | 0.5 | 1 | 2 | 4 | 8;
	}
}

/**
 * Submit the fatal error report to Discord webhook.
 */
export async function uploadLog(log: JProject, error: CoreError): Promise<void> {
	// Comment the next line to test fatal error reporting.
	if(!isOnline) return;

	try {
		const err_short = (error.message.match(/^[a-z ]+/i)?.[0] ?? "")
			.replace(/\s/g, "-")
			.substring(0, LOG_FILENAME_LENGTH);

		const trace = `Client trace:\n${block(error.clientTrace)}\nCore trace:\n${block(error.coreTrace)}`;
		const payload = {
			content: `A fatal error has occurred in BP Studio: **${error.message}**\n\n${getInfo()}\n\n${trace}\nFull log:`,
		};
		const jsonBlob = new Blob([JSON.stringify(log, null, JSON_INDENT)], { type: "application/json" });
		const formData = new FormData();
		formData.append("payload_json", JSON.stringify(payload));
		formData.append("file", jsonBlob, `${app_config.app_version}-${err_short}.json`);

		await fetch(WEBHOOK, {
			method: "POST", // Note that this won't work with file:// protocol somehow
			body: formData,
		});
	} catch(e) {
		// ignore any error here.
	}
	gtag("event", "fatal_error", gaErrorData(error.message + "\n" + error.coreTrace));
}

function getInfo(): string {
	let info = `User agent: ${navigator.userAgent}`;
	if(navigator.deviceMemory) info += `\nDevice memory: ${navigator.deviceMemory}`;
	if(navigator.hardwareConcurrency) info += `\nConcurrency: ${navigator.hardwareConcurrency}`;
	return info;
}

function block(str: string): string {
	return "```\n" + str + "\n```";
}
