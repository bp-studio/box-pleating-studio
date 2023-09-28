const $ = require("../utils/proxy");
const exg = require("@fal-works/esbuild-plugin-global-externals").globalExternals;
const gulp = require("gulp");

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

const exgConfig = {
	"vue": {
		varName: "Vue",
		namedExports: [
			"shallowRef", "watchEffect", "watch", "computed", "shallowReactive", "readonly", "nextTick", "effectScope",
			"createVNode", "Text", "ref", "getCurrentInstance", "Fragment", "defineComponent", "h", "inject",
			"onMounted", "onUnmounted", "onBeforeMount", "isRef", "reactive",
		],
		defaultExport: false,
	},
	"@pixi/core": {
		varName: "Pixi",
		namedExports: ["Renderer", "Ticker", "getTestContext", "ContextSystem", "StartupSystem", "Rectangle", "Polygon", "Circle"],
		defaultExport: false,
	},
	"@pixi/graphics": {
		varName: "Pixi",
		namedExports: ["Graphics"],
		defaultExport: false,
	},
	"@pixi/graphics-smooth": {
		varName: "Pixi",
		namedExports: ["SmoothGraphics", "LINE_SCALE_MODE", "settings"],
		defaultExport: false,
	},
	"@pixi/filter-alpha": {
		varName: "Pixi",
		namedExports: ["AlphaFilter"],
		defaultExport: false,
	},
	"@pixi/display": {
		varName: "Pixi",
		namedExports: ["Container"],
		defaultExport: false,
	},
	"@pixi/events": {
		varName: "Pixi",
		namedExports: ["EventBoundary"],
		defaultExport: false,
	},
	"@pixi/text": {
		varName: "Pixi",
		namedExports: ["Text"],
		defaultExport: false,
	},
};

function esb(options) {
	return $.esbuild(Object.assign({}, {
		outfile: "client.js",
		bundle: true,
		globalName: "bp",
		target,
		treeShaking: true,
		tsconfig: config.src.client + "/tsconfig.json",
		plugins: [exg(exgConfig)],
	}, options || {}));
}

gulp.task("clientDebug", () =>
	gulp.src(config.src.client + "/main.ts")
		.pipe(newer({
			dest: config.dest.debug + "/client.js",
			extra,
		}))
		.pipe(esb({
			define: {
				DEBUG_ENABLED: "true",
				TEST_MODE: "false",
			},
			sourcemap: "external",
			// We set this to true so that PIXI can be debugged,
			// as PIXI put source codes in its sourcemaps.
			// We can now setup breakpoints within the browser console.
			// Breakpoints setup within VS Code will still work.
			sourcesContent: true,
			sourceRoot: "../../",
		}))
		.pipe(sourceMap())
		.pipe(gulp.dest(config.dest.debug, { sourcemaps: "." }))
);

gulp.task("clientDist", () =>
	gulp.src(config.src.client + "/main.ts")
		.pipe(newer({
			dest: config.dest.dist + "/client.js",
			extra,
		}))
		.pipe(esb({
			define: {
				DEBUG_ENABLED: "false",
				TEST_MODE: "false",
			},
			minify: true,
			mangleProps: /^[$_]/,
			// These three exceptions are the private variables that PIXI will internally referred to by strings.
			reserveProps: /^_(view|plugin|multisample)/,
		}))
		.pipe(gulp.dest(config.dest.dist))
);

gulp.task("client", gulp.parallel("clientDebug", "clientDist"));
