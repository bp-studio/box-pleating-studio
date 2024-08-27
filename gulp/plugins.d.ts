/* eslint-disable @typescript-eslint/consistent-type-imports */
///<reference types="gulp-load-plugins" />

interface IGulpPlugins {
	all: typeof import("gulp-all");
	cleanCss: typeof import("gulp-clean-css");
	concat: typeof import("gulp-concat");
	esbuild: typeof import("gulp-esbuild");
	fontawesome: typeof import("gulp-fontawesome");
	htmlMinifierTerser: typeof import("gulp-html-minifier-terser");
	if: typeof import("gulp-if");
	newer: typeof import("gulp-newer");
	postcss: typeof import("gulp-postcss");
	replace: typeof import("gulp-replace");
	through2: typeof import("gulp-through2");
	vueSsg: typeof import("gulp-vue-ssg");
}
