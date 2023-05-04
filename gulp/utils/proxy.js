///<reference path="../plugins.d.ts" />
const { PassThrough } = require("stream");
const loadPlugins = require("gulp-load-plugins");

/**
 * These Gulp plugins have different behavior than the usual plugins,
 * so we don't use lazy initializations on them.
 */
const lazyExceptions = ["all", "if"];

module.exports = new Proxy(loadPlugins(), {
	get(target, name) {
		if(lazyExceptions.includes(name)) return target[name];
		return function(...args) {
			return new LazyStream(() => target[name](...args));
		};
	},
});

/**
 * {@link LazyStream} would initialize a stream only if there is anything in the upstream,
 * otherwise it behaves exactly like {@link PassThrough}.
 * This could save some initialization cost.
 */
class LazyStream extends PassThrough {
	constructor(factory) {
		super({ objectMode: true });
		this._factory = factory;
	}

	write(...args) {
		if(!this._target) {
			// Initialize target stream
			this._target = this._factory();
			while(this._target instanceof LazyStream) {
				this._target = this._target._factory();
			}

			// Bridging
			this._target.push = this.push.bind(this);
			this._target.on("error", e => this.emit("error", e));
			if(typeof this._target._flush == "function") {
				this._flush = cb => this._target._flush(cb);
			}
		}
		return super.write(...args);
	}

	_write(...args) {
		return this._target._write(...args);
	}

	_read(...args) {
		if(this._target) return this._target._read(...args);
		else return super._read(...args);
	}
}
