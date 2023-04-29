const $ = require("./proxy");

const config = require("../config.json");

// The file extension must be specified here, otherwise the folder will also be included
const compare = [
	config.src.app + "/**/*.vue",
	config.src.app + "/**/*.scss",
	config.src.donate + "/**/*.vue",
	config.src.public + "/*.htm",
];

/**
 * Purge a CSS file for a library.
 *
 * We need to re-perform the purge whenever a library updates or the comparing target updates,
 * so each file needs its only stream.
 */
module.exports.purge = function(stream) {
	return stream
		.pipe($.purgecss({
			content: compare,
			safelist: {
				standard: [/backdrop/], // for Bootstrap Modal
				variables: [
					"--bs-primary",
					/^--bs-btn-disabled/,
					/^--bs-nav-tabs/,
				],
			},
			// for Font Awesome
			keyframes: true,
			fontFace: true,

			// for Bootstrap
			variables: true,
		}))
		.pipe($.replace(/(\r|\n)*\/\*.+?\*\/$/, "")); // remove sourcemap
};

module.exports.extra = compare.concat([__filename]);
