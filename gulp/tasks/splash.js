/**
 * Gulp task for generating iOS splash screen images and updating index.htm.
 *
 * Usage: gulp splash
 *
 * Uses sharp to composite the app icon and title text onto a solid background.
 * The device list is fetched from pwa-asset-generator's GitHub repo.
 */

import { rm } from "node:fs/promises";
import gulp from "gulp";
import sharp from "sharp";
import through2 from "gulp-through2";

import config from "../config.json" with { type: "json" };

const APPLE_DEVICES_URL = "https://raw.githubusercontent.com/elegantapp/pwa-asset-generator/master/src/config/apple-fallback-data.json";

const SPLASH_DIR = "src/public/assets/splash";
const INDEX_PATH = config.src.app + "/html/index.htm";
const ICON_PATH = "src/public/assets/icon/icon-512.png";
const ICON_DARK_PATH = "src/other/icons/src/Icon-dark.png";

const BEGIN_MARKER = "<!-- BEGIN iOS Splash";
const END_MARKER = "<!-- END iOS Splash -->";

const APP_TITLE = "Box Pleating Studio";
const LIGHT_BG = "#ffffff";
const DARK_BG = "#1e1e1e"; // matches manifest.json color_scheme_dark.background_color
const LIGHT_TEXT = "#333333";
const DARK_TEXT = "#cccccc";

// Icon takes up 50% of the shorter dimension
const ICON_RATIO = 0.50;
// Font size relative to icon size
const FONT_RATIO = 0.12;

/**
 * Fetch the Apple device list and deduplicate by pixel dimensions.
 * Returns entries of { width, height, scaleFactor } in portrait orientation.
 */
async function fetchDeviceSizes() {
	const res = await fetch(APPLE_DEVICES_URL);
	if(!res.ok) throw new Error(`Failed to fetch device list: ${res.status}`);
	const devices = await res.json();

	const seen = new Set();
	const entries = [];
	for(const device of devices) {
		const { width, height } = device.portrait;
		const key = `${width}x${height}`;
		if(!seen.has(key)) {
			seen.add(key);
			entries.push({ width, height, scaleFactor: device.scaleFactor });
		}
	}
	return entries;
}

/**
 * Create a splash screen PNG buffer for the given pixel dimensions.
 */
async function createSplash(width, height, iconBuffer, dark = false) {
	const shorter = Math.min(width, height);
	const iconSize = Math.round(shorter * ICON_RATIO);
	const fontSize = Math.round(iconSize * FONT_RATIO);
	const bg = dark ? DARK_BG : LIGHT_BG;
	const textColor = dark ? DARK_TEXT : LIGHT_TEXT;

	const resizedIcon = await sharp(iconBuffer)
		.resize(iconSize, iconSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
		.png()
		.toBuffer();

	const textSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg">
		<text
			x="50%" y="50%"
			text-anchor="middle" dominant-baseline="central"
			font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
			font-size="${fontSize}px"
			font-weight="300"
			fill="${textColor}"
		>${APP_TITLE}</text>
	</svg>`);

	const textWidth = Math.round(fontSize * APP_TITLE.length * 0.55);
	const textHeight = Math.round(fontSize * 1.5);
	const textBuffer = await sharp(textSvg)
		.resize(textWidth, textHeight)
		.png()
		.toBuffer();

	const totalHeight = iconSize + textHeight;
	const startY = Math.round((height - totalHeight) / 2);
	const iconX = Math.round((width - iconSize) / 2);
	const textX = Math.round((width - textWidth) / 2);

	return sharp({
		create: {
			width,
			height,
			channels: 4,
			background: bg,
		},
	})
		.composite([
			{ input: resizedIcon, top: startY, left: iconX },
			{ input: textBuffer, top: startY + iconSize, left: textX },
		])
		.png({ compressionLevel: 9, quality: 60 })
		.toBuffer();
}

/**
 * Build a <link> tag string for the given device and orientation.
 */
function buildLink(size, landscape, dark = false) {
	const { width, height, scaleFactor } = size;
	// iOS media query always uses portrait CSS dimensions regardless of orientation
	const cssW = width / scaleFactor;
	const cssH = height / scaleFactor;
	const orient = landscape ? "landscape" : "portrait";
	const pxW = landscape ? height : width;
	const pxH = landscape ? width : height;
	const darkSuffix = dark ? "-dark" : "";
	const fileName = `${pxW}x${pxH}${darkSuffix}.png`;
	const darkMedia = dark ? " and (prefers-color-scheme: dark)" : "";
	const media = `screen and (width: ${cssW}px) and (height: ${cssH}px) and (-webkit-device-pixel-ratio: ${scaleFactor}) and (orientation: ${orient})${darkMedia}`;
	return {
		fileName,
		html: `\t<link rel="apple-touch-startup-image"\n\t\t  media="${media}"\n\t\t  href="assets/splash/${fileName}">`,
	};
}

/**
 * Generate all splash images from the icon file.
 * The input vinyl file (icon) is consumed; output is all splash PNG files.
 * The collected HTML link tags are stored in the `links` array.
 */
function generateSplashImages(sizes, links, dark = false) {
	return through2({
		name: "splash",
		async flush(files) {
			const iconFile = files[0];
			const iconBuffer = iconFile.contents;
			const results = [];

			await Promise.all(sizes.flatMap(size =>
				[false, true].map(async landscape => {
					const w = landscape ? size.height : size.width;
					const h = landscape ? size.width : size.height;
					const { fileName, html } = buildLink(size, landscape, dark);
					links.push(html);

					const buffer = await createSplash(w, h, iconBuffer, dark);
					const file = iconFile.clone({ contents: false });
					file.basename = fileName;
					file.contents = buffer;
					results.push(file);
					console.log(`Generated: ${fileName}`);
				})
			));

			return results;
		},
	});
}

/**
 * Replace the splash screen section in index.htm with the given link tags.
 */
function replaceSplashLinks(links) {
	const newSection = [
		`\t${BEGIN_MARKER} (auto-generated by gulp splash) -->`,
		links.join("\n"),
		`\t${END_MARKER}`,
	].join("\n");

	const pattern = new RegExp(
		`[\\t ]*${BEGIN_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`
	);

	return through2(content => content.replace(pattern, newSection));
}

function streamToPromise(stream) {
	return new Promise((resolve, reject) => {
		stream.on("end", resolve).on("error", reject);
	});
}

gulp.task("splash", async () => {
	const sizes = await fetchDeviceSizes();
	const links = [];

	await rm(SPLASH_DIR, { recursive: true, force: true });

	await streamToPromise(
		gulp.src(ICON_PATH, { encoding: false })
			.pipe(generateSplashImages(sizes, links))
			.pipe(gulp.dest(SPLASH_DIR))
	);
	await streamToPromise(
		gulp.src(ICON_DARK_PATH, { encoding: false })
			.pipe(generateSplashImages(sizes, links, true))
			.pipe(gulp.dest(SPLASH_DIR))
	);

	return gulp.src(INDEX_PATH, { base: "." })
		.pipe(replaceSplashLinks(links))
		.pipe(gulp.dest("."));
});
