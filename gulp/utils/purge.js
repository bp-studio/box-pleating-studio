const purge = require("gulp-purgecss");
const replace = require("gulp-replace");

const config = require("../config.json");

// 這邊必須指定副檔名，否則資料夾也會被比進去
const compare = [
	config.src.app + "/**/*.vue",
	config.src.app + "/**/*.scss",
	config.src.donate + "/**/*.vue",
	config.src.public + "/*.htm",
];

/**
 * 個別淨化一個 lib 的 CSS 檔案
 *
 * 當 lib 自己有更新、或者比較對象有更新的時候都要重新執行淨化，
 * 所以針對每一個檔案都要自己產一組 stream。
 */
module.exports.purge = function(stream) {
	return stream
		.pipe(purge({
			content: compare,
			safelist: {
				standard: [/backdrop/], // for Bootstrap Modal
				variables: [
					"--bs-primary",
					/^--bs-btn-disabled/,
					/^--bs-nav-tabs/,
				],
			},
			fontFace: false, // for Font Awesome
			variables: true, // for Bootstrap
		}))
		.pipe(replace(/(\r|\n)*\/\*.+?\*\/$/, "")); // remove sourcemap
};

module.exports.extra = compare.concat([__filename]);
