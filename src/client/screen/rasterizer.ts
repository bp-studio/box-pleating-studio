import ProjectService from "client/services/projectService";
import { svg } from "client/svg";
import { display } from "./display";
import { isPrinting } from "app/misc/isDark";

import type { Project } from "client/project/project";

const DEBOUNCE = 1000;
const GC_TIME = 5000;

/**
 * For detecting repeating triggering of {@link window.onbeforeprint} events.
 * Needed for mobile devices.
 */
let printing: boolean = false;

/**
 * In case of repeating triggering on mobile devices,
 * {@link window.onafterprint} event also fires repeatedly,
 * and we use this to detect the last one.
 */
let debounce: Timeout;

window.addEventListener("beforeprint", () => beforePrint(ProjectService.project.value));
window.addEventListener("afterprint", afterPrint);

export async function beforePrint(proj: Project | null): Promise<void> {
	if(!proj) proj = ProjectService.project.value;
	if(!proj) return;
	clearTimeout(debounce);
	const img = display.scrollView.$img;

	if(!printing &&
		// Resetting printing format on mobile devices will
		// trigger beforePrint again, but we can use the
		// following condition to exclude such cases.
		document.visibilityState == "visible"
	) {
		const old = img.src;

		// Wait until generating the next image before we recycle
		// the ObjectURL generated before. We also set a large delay
		// to cope with the possible latency when calling third-party
		// printing service on mobile devices.
		setTimeout(() => URL.revokeObjectURL(old), GC_TIME);

		isPrinting.value = true;
		const promise = new Promise((resolve, reject) => {
			img.onload = resolve;
			img.onerror = reject;
			img.src = URL.createObjectURL(svg(proj!, false));
		});
		isPrinting.value = false;
		printing = true;
		await promise;
	}
}

function afterPrint(): void {
	debounce = setTimeout(() => {
		printing = false;
		debounce = NaN;
	}, DEBOUNCE);
}

export function png(proj: Project): Promise<Blob> {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d")!;
	const img = display.scrollView.$img;
	return new Promise<Blob>(resolve => {
		img.addEventListener("load", () => {
			// Improves image quality on mobile devices
			img.style.width = img.naturalWidth * devicePixelRatio + "px";

			canvas.width = img.clientWidth;
			canvas.height = img.clientHeight;

			// Draw background
			ctx.fillStyle = app.isDark.value ? "black" : "white";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Draw the content of img onto canvas.
			// The maximal size of img is assigned with CSS (in bpstudio.scss).
			ctx.drawImage(img,
				0, 0, img.naturalWidth, img.naturalHeight,
				0, 0, img.clientWidth, img.clientHeight
			);

			printing = false;
			canvas.toBlob(blob => resolve(blob!));
		}, { once: true });
		beforePrint(proj);
	});
}

/* eslint-disable compat/compat */
export async function copyPNG(): Promise<void> {
	const blob = await png(ProjectService.project.value!);
	return navigator.clipboard.write([
		// Directly using `Promise<Blob>` is supported only for Chrome 97+,
		// so we await for the blob first and then use it.
		new ClipboardItem({ "image/png": blob }),
	]);
}
