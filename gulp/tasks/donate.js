const all = require("gulp-all");
const gulp = require("gulp");
const htmlMin = require("gulp-html-minifier-terser");
const replace = require("gulp-replace");

const newer = require("../utils/newer");
const { esbuild, extra, ssgI18n } = require("../utils/esbuild");
const config = require("../config.json");
const htmlMinOption = require("../html.json");

gulp.task("donate", () => all(
	// Vue
	gulp.src(config.src.donate + "/main.ts")
		.pipe(newer({
			dest: config.dest.dist + "/donate.js",
			extra: [__filename, extra, config.src.donate + "/**/*"],
		}))
		.pipe(esbuild({
			outfile: "donate.js",
			minify: true,
			tsconfig: config.src.donate + "/tsconfig.json",
		}))
		.pipe(gulp.dest(config.dest.dist)),

	// Html
	gulp.src(config.src.public + "/donate.htm")
		.pipe(newer({
			dest: config.dest.dist + "/donate.htm",
			extra: [__filename, extra],
		}))
		.pipe(htmlMin(htmlMinOption))
		// Avoid VS Code Linter warnings
		.pipe(replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"))
		.pipe(ssgI18n({
			appRoot: config.src.donate + "/app.vue",
			messages: { en: require("../../" + config.src.locale + "/en.json") },
		}))
		.pipe(gulp.dest(config.dest.dist))
));
