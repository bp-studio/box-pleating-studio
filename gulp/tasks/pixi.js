const esbuild = require("gulp-esbuild");
const exg = require("@fal-works/esbuild-plugin-global-externals").globalExternals;
const gulp = require("gulp");

const newer = require("../utils/newer");
const config = require("../config.json");

const root = "node_modules/";
const base = config.src.lib + "/pixi";

const exgConfig = {
	"@pixi/core": {
		varName: "PixiCore",
		namedExports: [
			"Renderer", "Ticker", "getTestContext", "ContextSystem", "Rectangle",
			"Matrix", "utils", "MASK_TYPES", "Transform", "RAD_TO_DEG", "DEG_TO_RAD", "settings",
			"Point", "ExtensionType", "extensions", "UPDATE_PRIORITY", "Filter", "defaultVertex",
			"State", "Color", "BLEND_MODES", "Texture", "Polygon", "PI_2", "RoundedRectangle", "Circle",
			"Ellipse", "SHAPES", "MSAA_QUALITY", "DRAW_MODES", "Geometry", "Buffer", "TYPES",
			"WRAP_MODES", "Shader", "Program", "BatchTextureArray", "BaseTexture", "UniformGroup",
			"BatchGeometry", "BatchDrawCall", "ObservablePoint", "StartupSystem",
		],
		defaultExport: false,
	},
};

// Set this to false to enable debugging
const minify = true;

function esb(options) {
	options = Object.assign({
		bundle: true,
		legalComments: "none",
		minify,
		sourcemap: minify ? undefined : "inline",
		sourcesContent: minify ? undefined : true,
		target: "es2016", // for maximal compatibility
	}, options);
	return esbuild(options);
}

module.exports.pixiCore = () =>
	gulp.src(base + "/core.ts", { base })
		.pipe(newer({
			dest: config.dest.dist + "/lib/pixi.core.js",
			extra: [__filename, root + "@pixi/core/package.json"],
		}))
		.pipe(esb({
			globalName: "PixiCore",
			outfile: "pixi.core.js",
		}))
		.pipe(gulp.dest(config.dest.dist + "/lib"));


module.exports.pixi = () =>
	gulp.src(base + "/pixi.ts", { base })
		.pipe(newer({
			dest: config.dest.dist + "/lib/pixi.js",
			extra: [__filename, root + "@pixi/core/package.json"],
		}))
		.pipe(esb({
			globalName: "Pixi",
			outfile: "pixi.js",
			plugins: [exg(exgConfig)],
		}))
		.pipe(gulp.dest(config.dest.dist + "/lib"));
