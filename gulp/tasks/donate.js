const $ = require("../utils/proxy");
const gulp = require("gulp");

const newer = require("../utils/newer");
const { extra, ssgI18n } = require("../utils/esbuild");
const config = require("../config.json");
const htmlMinOption = require("../html.json");

gulp.task("donate", () =>
	gulp.src(config.src.donate + "/donate.htm")
		.pipe(newer({
			dest: config.dest.temp + "/donate.htm",
			extra: [__filename, extra],
		}))
		.pipe($.htmlMinifierTerser(htmlMinOption))
		// Avoid VS Code Linter warnings
		.pipe($.replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"))
		.pipe(ssgI18n({
			appRoot: config.src.donate + "/app.vue",
			messages: { en: require("../../" + config.src.locale + "/en.json") },
		}))
		.pipe(gulp.dest(config.dest.temp))
);
