const esbuild = require("gulp-esbuild");
const exg = require("esbuild-plugin-external-global").externalGlobalPlugin;
const gulp = require("gulp");
const replace = require("gulp-replace");
const terser = require("gulp-terser");

const newer = require("../utils/newer");
const config = require("../config.json");
const { target, extra: ext, sourceMap } = require("../utils/esbuild");
const extra = [
	__filename,
	ext,
	config.src.client + "/**/*",
	config.src.shared + "/**/*",
	"node_modules/pixi.js/package.json",
];

function esb(options) {
	return esbuild(Object.assign({}, {
		outfile: "client.js",
		bundle: true,
		globalName: "bp",
		target,
		treeShaking: true,
		tsconfig: config.src.client + "/tsconfig.json",
		plugins: [
			exg({
				"vue": "window.Vue",
			}),
		],
	}, options || {}));
}

gulp.task("clientDebug", () =>
	gulp.src(config.src.client + "/main.ts")
		.pipe(newer({
			dest: config.dest.debug + "/client.js",
			extra,
		}))
		.pipe(esb({ sourcemap: "external", sourcesContent: false, sourceRoot: "../../" }))
		.pipe(sourceMap())
		.pipe(terser({
			ecma: 2018,
			compress: {
				defaults: false,
				drop_debugger: false,
				global_defs: {
					DEBUG_ENABLED: true,
					TEST_MODE: false,
				},
			},
			mangle: false,
			format: {
				beautify: true,
				comments: true,
			},
		}))
		.pipe(gulp.dest(config.dest.debug, { sourcemaps: "." }))
);

gulp.task("clientDist", () =>
	gulp.src(config.src.client + "/main.ts")
		.pipe(newer({
			dest: config.dest.dist + "/client.js",
			extra,
		}))
		.pipe(esb({ minify: true })) // This will still make a slight difference even we've used terser
		.pipe(replace(/(["'])[$_][a-z_0-9]+\1/gi, "$$$$$$$$[$&]")) // Prepare decorator mangling
		.pipe(terser({
			ecma: 2018,
			compress: {
				drop_debugger: false,
				global_defs: {
					DEBUG_ENABLED: false,
					TEST_MODE: false,
				},
			},
			// These three exceptions are the private variables that PIXI will internally referred to by strings.
			mangle: { properties: { regex: /^[$_](?!view|plugin|multisample)/ } },
			format: {
				comments: false,
			},
		}))
		.pipe(replace(/\$\$\$\$\.([a-z$_][a-z$_0-9]*)/gi, "'$1'")) // Restore
		.pipe(gulp.dest(config.dest.dist))
);

gulp.task("client", gulp.parallel("clientDebug", "clientDist"));
