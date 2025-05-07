var Module = (() => {
  var _scriptName = import.meta.url;
  
  return (
async function(moduleArg = {}) {
  var moduleRtn;

function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// include: shell.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = moduleArg;

// Set up the promise that indicates the Module is initialized
var readyPromiseResolve, readyPromiseReject;
var readyPromise = new Promise((resolve, reject) => {
  readyPromiseResolve = resolve;
  readyPromiseReject = reject;
});

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = true;
var ENVIRONMENT_IS_SHELL = false;
if (ENVIRONMENT_IS_NODE) {
  // When building an ES module `require` is not normally available.
  // We need to use `createRequire()` to construct the require()` function.
  const {
    createRequire
  } = await import("module");
  /** @suppress{duplicate} */
  var require = createRequire(import.meta.url);
}

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = (status, toThrow) => {
  throw toThrow;
};

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = "";
function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;
if (ENVIRONMENT_IS_NODE) {
  if (typeof process == "undefined" || !process.release || process.release.name !== "node") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  var nodeVersion = process.versions.node;
  var numericVersion = nodeVersion.split(".").slice(0, 3);
  numericVersion = numericVersion[0] * 1e4 + numericVersion[1] * 100 + numericVersion[2].split("-")[0] * 1;
  var minVersion = 16e4;
  if (numericVersion < 16e4) {
    throw new Error("This emscripten-generated code requires node v16.0.0 (detected v" + nodeVersion + ")");
  }
  // These modules will usually be used on Node.js. Load them eagerly to avoid
  // the complexity of lazy-loading.
  var fs = require("fs");
  var nodePath = require("path");
  // EXPORT_ES6 + ENVIRONMENT_IS_NODE always requires use of import.meta.url,
  // since there's no way getting the current absolute path of the module when
  // support for that is not available.
  if (!import.meta.url.startsWith("data:")) {
    scriptDirectory = nodePath.dirname(require("url").fileURLToPath(import.meta.url)) + "/";
  }
  // include: node_shell_read.js
  readBinary = filename => {
    // We need to re-wrap `file://` strings to URLs.
    filename = isFileURI(filename) ? new URL(filename) : filename;
    var ret = fs.readFileSync(filename);
    assert(Buffer.isBuffer(ret));
    return ret;
  };
  readAsync = async function (filename) {
    let binary = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    // See the comment in the `readBinary` function.
    filename = isFileURI(filename) ? new URL(filename) : filename;
    var ret = fs.readFileSync(filename, binary ? undefined : "utf8");
    assert(binary ? Buffer.isBuffer(ret) : typeof ret == "string");
    return ret;
  };
  // end include: node_shell_read.js
  if (process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, "/");
  }
  arguments_ = process.argv.slice(2);
  quit_ = (status, toThrow) => {
    process.exitCode = status;
    throw toThrow;
  };
} else if (ENVIRONMENT_IS_SHELL) {
  if (typeof process == "object" && typeof require === "function" || typeof window == "object" || typeof WorkerGlobalScope != "undefined") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
} else
  // Note that this includes Node.js workers when relevant (pthreads is enabled).
  // Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
  // ENVIRONMENT_IS_NODE.
  {
    throw new Error("environment detection error");
  }
var out = console.log.bind(console);
var err = console.error.bind(console);
var IDBFS = "IDBFS is no longer included by default; build with -lidbfs.js";
var PROXYFS = "PROXYFS is no longer included by default; build with -lproxyfs.js";
var WORKERFS = "WORKERFS is no longer included by default; build with -lworkerfs.js";
var FETCHFS = "FETCHFS is no longer included by default; build with -lfetchfs.js";
var ICASEFS = "ICASEFS is no longer included by default; build with -licasefs.js";
var JSFILEFS = "JSFILEFS is no longer included by default; build with -ljsfilefs.js";
var OPFS = "OPFS is no longer included by default; build with -lopfs.js";
var NODEFS = "NODEFS is no longer included by default; build with -lnodefs.js";

// perform assertions in shell.js after we set up out() and err(), as otherwise
// if an assertion fails it cannot print the message
assert(!ENVIRONMENT_IS_WEB, "web environment detected but not enabled at build time.  Add `web` to `-sENVIRONMENT` to enable.");
assert(!ENVIRONMENT_IS_WORKER, "worker environment detected but not enabled at build time.  Add `worker` to `-sENVIRONMENT` to enable.");
assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable.");

// end include: shell.js
// include: preamble.js
// === Preamble library stuff ===
// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html
var wasmBinary;
if (typeof WebAssembly != "object") {
  err("no native wasm support detected");
}

// Wasm globals
var wasmMemory;

//========================================
// Runtime essentials
//========================================
// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort("Assertion failed" + (text ? ": " + text : ""));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.
// Memory management
var HEAP, /** @type {!Int8Array} */HEAP8, /** @type {!Uint8Array} */HEAPU8, /** @type {!Int16Array} */HEAP16, /** @type {!Uint16Array} */HEAPU16, /** @type {!Int32Array} */HEAP32, /** @type {!Uint32Array} */HEAPU32, /** @type {!Float32Array} */HEAPF32, /** @type {!Float64Array} */HEAPF64;
var runtimeInitialized = false;

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */
var isFileURI = filename => filename.startsWith("file://");

// include: runtime_shared.js
// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[max >>> 2 >>> 0] = 34821223;
  HEAPU32[max + 4 >>> 2 >>> 0] = 2310721022;
  // Also test the global address 0 for integrity.
  HEAPU32[0 >>> 2 >>> 0] = 1668509029;
}
function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = HEAPU32[max >>> 2 >>> 0];
  var cookie2 = HEAPU32[max + 4 >>> 2 >>> 0];
  if (cookie1 != 34821223 || cookie2 != 2310721022) {
    abort("Stack overflow! Stack cookie has been overwritten at ".concat(ptrToString(max), ", expected hex dwords 0x89BACDFE and 0x2135467, but received ").concat(ptrToString(cookie2), " ").concat(ptrToString(cookie1)));
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[0 >>> 2 >>> 0] != 1668509029) {
    abort("Runtime error: The application has corrupted its heap memory area (address zero)!");
  }
}

// end include: runtime_stack_check.js
// include: runtime_exceptions.js
// Base Emscripten EH error class
class EmscriptenEH extends Error {}
class EmscriptenSjLj extends EmscriptenEH {}
class CppException extends EmscriptenEH {
  constructor(excPtr) {
    super(excPtr);
    this.excPtr = excPtr;
    const excInfo = getExceptionMessage(excPtr);
    this.name = excInfo[0];
    this.message = excInfo[1];
  }
}

// end include: runtime_exceptions.js
// include: runtime_debug.js
// Endianness check
(() => {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 25459;
  if (h8[0] !== 115 || h8[1] !== 99) throw "Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)";
})();
function consumedModuleProp(prop) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      set() {
        abort("Attempt to set `Module.".concat(prop, "` after it has already been processed.  This can happen, for example, when code is injected via '--post-js' rather than '--pre-js'"));
      }
    });
  }
}
function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort("`Module.".concat(prop, "` was supplied but `").concat(prop, "` not included in INCOMING_MODULE_JS_API"));
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === "FS_createPath" || name === "FS_createDataFile" || name === "FS_createPreloadedFile" || name === "FS_unlink" || name === "addRunDependency" ||
  // The old FS has some functionality that WasmFS lacks.
  name === "FS_createLazyFile" || name === "FS_createDevice" || name === "removeRunDependency";
}

/**
 * Intercept access to a global symbol.  This enables us to give informative
 * warnings/errors when folks attempt to use symbols they did not include in
 * their build, or no symbols that no longer exist.
 */
function hookGlobalSymbolAccess(sym, func) {
  if (typeof globalThis != "undefined" && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        func();
        return undefined;
      }
    });
  }
}
function missingGlobal(sym, msg) {
  hookGlobalSymbolAccess(sym, () => {
    warnOnce("`".concat(sym, "` is not longer defined by emscripten. ").concat(msg));
  });
}
missingGlobal("buffer", "Please use HEAP8.buffer or wasmMemory.buffer");
missingGlobal("asm", "Please use wasmExports instead");
function missingLibrarySymbol(sym) {
  hookGlobalSymbolAccess(sym, () => {
    // Can't `abort()` here because it would break code that does runtime
    // checks.  e.g. `if (typeof SDL === 'undefined')`.
    var msg = "`".concat(sym, "` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line");
    // DEFAULT_LIBRARY_FUNCS_TO_INCLUDE requires the name as it appears in
    // library.js, which means $name for a JS name with no prefix, or name
    // for a JS name like _name.
    var librarySymbol = sym;
    if (!librarySymbol.startsWith("_")) {
      librarySymbol = "$" + sym;
    }
    msg += " (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='".concat(librarySymbol, "')");
    if (isExportedByForceFilesystem(sym)) {
      msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
    }
    warnOnce(msg);
  });
  // Any symbol that is not included from the JS library is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}
function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        var msg = "'".concat(sym, "' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)");
        if (isExportedByForceFilesystem(sym)) {
          msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
        }
        abort(msg);
      }
    });
  }
}
var runtimeDebug = true;

// Switch to false at runtime to disable logging at the right times
// Used by XXXXX_DEBUG settings to output debug messages.
function dbg() {
  if (!runtimeDebug && typeof runtimeDebug != "undefined") return;
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn(...arguments);
}

// end include: runtime_debug.js
// include: memoryprofiler.js
// end include: memoryprofiler.js
function updateMemoryViews() {
  var b = wasmMemory.buffer;
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  HEAP32 = new Int32Array(b);
  HEAPU32 = new Uint32Array(b);
  HEAPF32 = new Float32Array(b);
  HEAPF64 = new Float64Array(b);
}

// end include: runtime_shared.js
assert(typeof Int32Array != "undefined" && typeof Float64Array !== "undefined" && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined, "JS engine does not provide full typed array support");
function preRun() {
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift());
    }
  }
  consumedModuleProp("preRun");
  // Begin ATPRERUNS hooks
  callRuntimeCallbacks(onPreRuns);
}
function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;
  checkStackCookie();
  // No ATINITS hooks
  wasmExports["__wasm_call_ctors"]();
}
function postRun() {
  checkStackCookie();
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift());
    }
  }
  consumedModuleProp("postRun");
  // Begin ATPOSTRUNS hooks
  callRuntimeCallbacks(onPostRuns);
}

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var dependenciesFulfilled = null;

// overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};
var runDependencyWatcher = null;
function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
}
function addRunDependency(id) {
  var _Module$monitorRunDep;
  runDependencies++;
  (_Module$monitorRunDep = Module["monitorRunDependencies"]) === null || _Module$monitorRunDep === void 0 || _Module$monitorRunDep.call(Module, runDependencies);
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval != "undefined") {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(() => {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err("still waiting on run dependencies:");
          }
          err("dependency: ".concat(dep));
        }
        if (shown) {
          err("(end of list)");
        }
      }, 1e4);
    }
  } else {
    err("warning: run dependency added without ID");
  }
}
function removeRunDependency(id) {
  var _Module$monitorRunDep2;
  runDependencies--;
  (_Module$monitorRunDep2 = Module["monitorRunDependencies"]) === null || _Module$monitorRunDep2 === void 0 || _Module$monitorRunDep2.call(Module, runDependencies);
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err("warning: run dependency removed without ID");
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
}

/** @param {string|number=} what */
function abort(what) {
  var _Module$onAbort;
  (_Module$onAbort = Module["onAbort"]) === null || _Module$onAbort === void 0 || _Module$onAbort.call(Module, what);
  what = "Aborted(" + what + ")";
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);
  ABORT = true;
  if (what.indexOf("RuntimeError: unreachable") >= 0) {
    what += '. "unreachable" may be due to ASYNCIFY_STACK_SIZE not being large enough (try increasing it)';
  }
  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.
  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);
  readyPromiseReject(e);
  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

// show errors on likely calls to FS when it was not included
var FS = {
  error() {
    abort("Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM");
  },
  init() {
    FS.error();
  },
  createDataFile() {
    FS.error();
  },
  createPreloadedFile() {
    FS.error();
  },
  createLazyFile() {
    FS.error();
  },
  open() {
    FS.error();
  },
  mkdev() {
    FS.error();
  },
  registerDevice() {
    FS.error();
  },
  analyzePath() {
    FS.error();
  },
  ErrnoError() {
    FS.error();
  }
};
function createExportWrapper(name, nargs) {
  return function () {
    assert(runtimeInitialized, "native function `".concat(name, "` called before runtime initialization"));
    var f = wasmExports[name];
    assert(f, "exported native function `".concat(name, "` not found"));
    // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
    assert(arguments.length <= nargs, "native function `".concat(name, "` called with ").concat(arguments.length, " args but expects ").concat(nargs));
    return f(...arguments);
  };
}
var wasmBinaryFile;
function findWasmBinary() {
  if (Module["locateFile"]) {
    return locateFile("optimizer.wasm");
  }
  // Use bundler-friendly `new URL(..., import.meta.url)` pattern; works in browsers too.
  return new URL("optimizer.wasm", import.meta.url).href;
}
function getBinarySync(file) {
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
    return readBinary(file);
  }
  throw "both async and sync fetching of the wasm failed";
}
async function getWasmBinary(binaryFile) {
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary) {
    // Fetch the binary using readAsync
    try {
      var response = await readAsync(binaryFile);
      return new Uint8Array(response);
    } catch {}
  }
  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}
async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err("failed to asynchronously prepare wasm: ".concat(reason));
    // Warn on some common problems.
    if (isFileURI(wasmBinaryFile)) {
      err("warning: Loading from a file URI (".concat(wasmBinaryFile, ") is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing"));
    }
    abort(reason);
  }
}
async function instantiateAsync(binary, binaryFile, imports) {
  if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !ENVIRONMENT_IS_NODE) {
    try {
      var response = fetch(binaryFile, {
        credentials: "same-origin"
      });
      var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
      return instantiationResult;
    } catch (reason) {
      // We expect the most common failure cause to be a bad MIME type for the binary,
      // in which case falling back to ArrayBuffer instantiation should work.
      err("wasm streaming compile failed: ".concat(reason));
      err("falling back to ArrayBuffer instantiation");
    }
  }
  return instantiateArrayBuffer(binaryFile, imports);
}
function getWasmImports() {
  // instrumenting imports is used in asyncify in two ways: to add assertions
  // that check for proper import use, and for ASYNCIFY=2 we use them to set up
  // the Promise API on the import side.
  Asyncify.instrumentWasmImports(wasmImports);
  // prepare imports
  return {
    "env": wasmImports,
    "wasi_snapshot_preview1": wasmImports
  };
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    wasmExports = instance.exports;
    wasmExports = Asyncify.instrumentWasmExports(wasmExports);
    wasmExports = applySignatureConversions(wasmExports);
    wasmMemory = wasmExports["memory"];
    assert(wasmMemory, "memory not found in wasm exports");
    updateMemoryViews();
    wasmTable = wasmExports["__indirect_function_table"];
    assert(wasmTable, "table not found in wasm exports");
    removeRunDependency("wasm-instantiate");
    return wasmExports;
  }
  // wait for the pthread pool (if any)
  addRunDependency("wasm-instantiate");
  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
    trueModule = null;
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    return receiveInstance(result["instance"]);
  }
  var info = getWasmImports();
  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  if (Module["instantiateWasm"]) {
    return new Promise((resolve, reject) => {
      try {
        Module["instantiateWasm"](info, (mod, inst) => {
          resolve(receiveInstance(mod, inst));
        });
      } catch (e) {
        err("Module.instantiateWasm callback failed with error: ".concat(e));
        reject(e);
      }
    });
  }
  wasmBinaryFile !== null && wasmBinaryFile !== void 0 ? wasmBinaryFile : wasmBinaryFile = findWasmBinary();
  try {
    var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
    var exports = receiveInstantiationResult(result);
    return exports;
  } catch (e) {
    // If instantiation fails, reject the module ready promise.
    readyPromiseReject(e);
    return Promise.reject(e);
  }
}

// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;
var tempI64;

// end include: preamble.js
// Begin JS library code
class ExitStatus {
  constructor(status) {
    _defineProperty(this, "name", "ExitStatus");
    this.message = "Program terminated with exit(".concat(status, ")");
    this.status = status;
  }
}
var callRuntimeCallbacks = callbacks => {
  while (callbacks.length > 0) {
    // Pass the module as the first argument.
    callbacks.shift()(Module);
  }
};
var onPostRuns = [];
var addOnPostRun = cb => onPostRuns.push(cb);
var onPreRuns = [];
var addOnPreRun = cb => onPreRuns.push(cb);

/**
     * @param {number} ptr
     * @param {string} type
     */
function getValue(ptr) {
  let type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "i8";
  if (type.endsWith("*")) type = "*";
  switch (type) {
    case "i1":
      return HEAP8[ptr >>> 0];
    case "i8":
      return HEAP8[ptr >>> 0];
    case "i16":
      return HEAP16[ptr >>> 1 >>> 0];
    case "i32":
      return HEAP32[ptr >>> 2 >>> 0];
    case "i64":
      abort("to do getValue(i64) use WASM_BIGINT");
    case "float":
      return HEAPF32[ptr >>> 2 >>> 0];
    case "double":
      return HEAPF64[ptr >>> 3 >>> 0];
    case "*":
      return HEAPU32[ptr >>> 2 >>> 0];
    default:
      abort("invalid type for getValue: ".concat(type));
  }
}
var noExitRuntime = true;
var ptrToString = ptr => {
  assert(typeof ptr === "number");
  return "0x" + ptr.toString(16).padStart(8, "0");
};

/**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */
function setValue(ptr, value) {
  let type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "i8";
  if (type.endsWith("*")) type = "*";
  switch (type) {
    case "i1":
      HEAP8[ptr >>> 0] = value;
      break;
    case "i8":
      HEAP8[ptr >>> 0] = value;
      break;
    case "i16":
      HEAP16[ptr >>> 1 >>> 0] = value;
      break;
    case "i32":
      HEAP32[ptr >>> 2 >>> 0] = value;
      break;
    case "i64":
      abort("to do setValue(i64) use WASM_BIGINT");
    case "float":
      HEAPF32[ptr >>> 2 >>> 0] = value;
      break;
    case "double":
      HEAPF64[ptr >>> 3 >>> 0] = value;
      break;
    case "*":
      HEAPU32[ptr >>> 2 >>> 0] = value;
      break;
    default:
      abort("invalid type for setValue: ".concat(type));
  }
}
var stackRestore = val => __emscripten_stack_restore(val);
var stackSave = () => _emscripten_stack_get_current();
var warnOnce = text => {
  warnOnce.shown || (warnOnce.shown = {});
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
    err(text);
  }
};
var convertI32PairToI53Checked = (lo, hi) => {
  assert(lo == lo >>> 0 || lo == (lo | 0));
  // lo should either be a i32 or a u32
  assert(hi === (hi | 0));
  // hi should be a i32
  return hi + 2097152 >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
};
var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder() : undefined;

/**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number=} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */
var UTF8ArrayToString = function (heapOrArray) {
  let idx = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  let maxBytesToRead = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : NaN;
  idx >>>= 0;
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on
  // null terminator by itself.  Also, use the length info to avoid running tiny
  // strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation,
  // so that undefined/NaN means Infinity)
  while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
  }
  var str = "";
  // If building with TextDecoder, we have already computed the string length
  // above, so test loop end condition against that
  while (idx < endPtr) {
    // For UTF8 byte structure, see:
    // http://en.wikipedia.org/wiki/UTF-8#Description
    // https://www.ietf.org/rfc/rfc2279.txt
    // https://tools.ietf.org/html/rfc3629
    var u0 = heapOrArray[idx++];
    if (!(u0 & 128)) {
      str += String.fromCharCode(u0);
      continue;
    }
    var u1 = heapOrArray[idx++] & 63;
    if ((u0 & 224) == 192) {
      str += String.fromCharCode((u0 & 31) << 6 | u1);
      continue;
    }
    var u2 = heapOrArray[idx++] & 63;
    if ((u0 & 240) == 224) {
      u0 = (u0 & 15) << 12 | u1 << 6 | u2;
    } else {
      if ((u0 & 248) != 240) warnOnce("Invalid UTF-8 leading byte " + ptrToString(u0) + " encountered when deserializing a UTF-8 string in wasm memory to a JS string!");
      u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
    }
    if (u0 < 65536) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 65536;
      str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
    }
  }
  return str;
};

/**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */
var UTF8ToString = (ptr, maxBytesToRead) => {
  assert(typeof ptr == "number", "UTF8ToString expects a number (got ".concat(typeof ptr, ")"));
  ptr >>>= 0;
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
};
function ___assert_fail(condition, filename, line, func) {
  condition >>>= 0;
  filename >>>= 0;
  func >>>= 0;
  return abort("Assertion failed: ".concat(UTF8ToString(condition), ", at: ") + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"]);
}
var exceptionCaught = [];
var uncaughtExceptionCount = 0;
function ___cxa_begin_catch(ptr) {
  ptr >>>= 0;
  var info = new ExceptionInfo(ptr);
  if (!info.get_caught()) {
    info.set_caught(true);
    uncaughtExceptionCount--;
  }
  info.set_rethrown(false);
  exceptionCaught.push(info);
  ___cxa_increment_exception_refcount(ptr);
  return ___cxa_get_exception_ptr(ptr);
}
var exceptionLast = 0;
var ___cxa_end_catch = () => {
  // Clear state flag.
  _setThrew(0, 0);
  assert(exceptionCaught.length > 0);
  // Call destructor if one is registered then clear it.
  var info = exceptionCaught.pop();
  ___cxa_decrement_exception_refcount(info.excPtr);
  exceptionLast = 0;
};
class ExceptionInfo {
  // excPtr - Thrown object pointer to wrap. Metadata pointer is calculated from it.
  constructor(excPtr) {
    this.excPtr = excPtr;
    this.ptr = excPtr - 24;
  }
  set_type(type) {
    HEAPU32[this.ptr + 4 >>> 2 >>> 0] = type;
  }
  get_type() {
    return HEAPU32[this.ptr + 4 >>> 2 >>> 0];
  }
  set_destructor(destructor) {
    HEAPU32[this.ptr + 8 >>> 2 >>> 0] = destructor;
  }
  get_destructor() {
    return HEAPU32[this.ptr + 8 >>> 2 >>> 0];
  }
  set_caught(caught) {
    caught = caught ? 1 : 0;
    HEAP8[this.ptr + 12 >>> 0] = caught;
  }
  get_caught() {
    return HEAP8[this.ptr + 12 >>> 0] != 0;
  }
  set_rethrown(rethrown) {
    rethrown = rethrown ? 1 : 0;
    HEAP8[this.ptr + 13 >>> 0] = rethrown;
  }
  get_rethrown() {
    return HEAP8[this.ptr + 13 >>> 0] != 0;
  }
  // Initialize native structure fields. Should be called once after allocated.
  init(type, destructor) {
    this.set_adjusted_ptr(0);
    this.set_type(type);
    this.set_destructor(destructor);
  }
  set_adjusted_ptr(adjustedPtr) {
    HEAPU32[this.ptr + 16 >>> 2 >>> 0] = adjustedPtr;
  }
  get_adjusted_ptr() {
    return HEAPU32[this.ptr + 16 >>> 2 >>> 0];
  }
}
var setTempRet0 = val => __emscripten_tempret_set(val);
var findMatchingCatch = args => {
  var _exceptionLast;
  var thrown = (_exceptionLast = exceptionLast) === null || _exceptionLast === void 0 ? void 0 : _exceptionLast.excPtr;
  if (!thrown) {
    // just pass through the null ptr
    setTempRet0(0);
    return 0;
  }
  var info = new ExceptionInfo(thrown);
  info.set_adjusted_ptr(thrown);
  var thrownType = info.get_type();
  if (!thrownType) {
    // just pass through the thrown ptr
    setTempRet0(0);
    return thrown;
  }
  // can_catch receives a **, add indirection
  // The different catch blocks are denoted by different types.
  // Due to inheritance, those types may not precisely match the
  // type of the thrown object. Find one which matches, and
  // return the type of the catch block which should be called.
  for (var caughtType of args) {
    if (caughtType === 0 || caughtType === thrownType) {
      // Catch all clause matched or exactly the same type is caught
      break;
    }
    var adjusted_ptr_addr = info.ptr + 16;
    if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
      setTempRet0(caughtType);
      return thrown;
    }
  }
  setTempRet0(thrownType);
  return thrown;
};
function ___cxa_find_matching_catch_2() {
  return findMatchingCatch([]);
}
function ___cxa_find_matching_catch_3(arg0) {
  arg0 >>>= 0;
  return findMatchingCatch([arg0]);
}
var ___cxa_rethrow = () => {
  var info = exceptionCaught.pop();
  if (!info) {
    abort("no exception to throw");
  }
  var ptr = info.excPtr;
  if (!info.get_rethrown()) {
    // Only pop if the corresponding push was through rethrow_primary_exception
    exceptionCaught.push(info);
    info.set_rethrown(true);
    info.set_caught(false);
    uncaughtExceptionCount++;
  }
  exceptionLast = new CppException(ptr);
  throw exceptionLast;
};
function ___cxa_throw(ptr, type, destructor) {
  ptr >>>= 0;
  type >>>= 0;
  destructor >>>= 0;
  var info = new ExceptionInfo(ptr);
  // Initialize ExceptionInfo content after it was allocated in __cxa_allocate_exception.
  info.init(type, destructor);
  exceptionLast = new CppException(ptr);
  uncaughtExceptionCount++;
  throw exceptionLast;
}
var ___cxa_uncaught_exceptions = () => uncaughtExceptionCount;
function ___resumeException(ptr) {
  ptr >>>= 0;
  if (!exceptionLast) {
    exceptionLast = new CppException(ptr);
  }
  throw exceptionLast;
}
var __abort_js = () => abort("native code called abort()");
function __embind_register_bigint(primitiveType, name, size, minRange, maxRange) {
  primitiveType >>>= 0;
  name >>>= 0;
  size >>>= 0;
}
var embind_init_charCodes = () => {
  var codes = new Array(256);
  for (var i = 0; i < 256; ++i) {
    codes[i] = String.fromCharCode(i);
  }
  embind_charCodes = codes;
};
var embind_charCodes;
var readLatin1String = ptr => {
  var ret = "";
  var c = ptr;
  while (HEAPU8[c >>> 0]) {
    ret += embind_charCodes[HEAPU8[c++ >>> 0]];
  }
  return ret;
};
var awaitingDependencies = {};
var registeredTypes = {};
var typeDependencies = {};
var BindingError = Module["BindingError"] = class BindingError extends Error {
  constructor(message) {
    super(message);
    this.name = "BindingError";
  }
};
var throwBindingError = message => {
  throw new BindingError(message);
};

/** @param {Object=} options */
function sharedRegisterType(rawType, registeredInstance) {
  let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var name = registeredInstance.name;
  if (!rawType) {
    throwBindingError("type \"".concat(name, "\" must have a positive integer typeid pointer"));
  }
  if (registeredTypes.hasOwnProperty(rawType)) {
    if (options.ignoreDuplicateRegistrations) {
      return;
    } else {
      throwBindingError("Cannot register type '".concat(name, "' twice"));
    }
  }
  registeredTypes[rawType] = registeredInstance;
  delete typeDependencies[rawType];
  if (awaitingDependencies.hasOwnProperty(rawType)) {
    var callbacks = awaitingDependencies[rawType];
    delete awaitingDependencies[rawType];
    callbacks.forEach(cb => cb());
  }
}

/** @param {Object=} options */
function registerType(rawType, registeredInstance) {
  let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  if (registeredInstance.argPackAdvance === undefined) {
    throw new TypeError("registerType registeredInstance requires argPackAdvance");
  }
  return sharedRegisterType(rawType, registeredInstance, options);
}
var GenericWireTypeSize = 8;

/** @suppress {globalThis} */
function __embind_register_bool(rawType, name, trueValue, falseValue) {
  rawType >>>= 0;
  name >>>= 0;
  name = readLatin1String(name);
  registerType(rawType, {
    name,
    "fromWireType": function (wt) {
      // ambiguous emscripten ABI: sometimes return values are
      // true or false, and sometimes integers (0 or 1)
      return !!wt;
    },
    "toWireType": function (destructors, o) {
      return o ? trueValue : falseValue;
    },
    argPackAdvance: GenericWireTypeSize,
    "readValueFromPointer": function (pointer) {
      return this["fromWireType"](HEAPU8[pointer >>> 0]);
    },
    destructorFunction: null
  });
}
var shallowCopyInternalPointer = o => ({
  count: o.count,
  deleteScheduled: o.deleteScheduled,
  preservePointerOnDelete: o.preservePointerOnDelete,
  ptr: o.ptr,
  ptrType: o.ptrType,
  smartPtr: o.smartPtr,
  smartPtrType: o.smartPtrType
});
var throwInstanceAlreadyDeleted = obj => {
  function getInstanceTypeName(handle) {
    return handle.$$.ptrType.registeredClass.name;
  }
  throwBindingError(getInstanceTypeName(obj) + " instance already deleted");
};
var finalizationRegistry = false;
var detachFinalizer = handle => {};
var runDestructor = $$ => {
  if ($$.smartPtr) {
    $$.smartPtrType.rawDestructor($$.smartPtr);
  } else {
    $$.ptrType.registeredClass.rawDestructor($$.ptr);
  }
};
var releaseClassHandle = $$ => {
  $$.count.value -= 1;
  var toDelete = 0 === $$.count.value;
  if (toDelete) {
    runDestructor($$);
  }
};
var downcastPointer = (ptr, ptrClass, desiredClass) => {
  if (ptrClass === desiredClass) {
    return ptr;
  }
  if (undefined === desiredClass.baseClass) {
    return null;
  }
  var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
  if (rv === null) {
    return null;
  }
  return desiredClass.downcast(rv);
};
var registeredPointers = {};
var registeredInstances = {};
var getBasestPointer = (class_, ptr) => {
  if (ptr === undefined) {
    throwBindingError("ptr should not be undefined");
  }
  while (class_.baseClass) {
    ptr = class_.upcast(ptr);
    class_ = class_.baseClass;
  }
  return ptr;
};
var getInheritedInstance = (class_, ptr) => {
  ptr = getBasestPointer(class_, ptr);
  return registeredInstances[ptr];
};
var InternalError = Module["InternalError"] = class InternalError extends Error {
  constructor(message) {
    super(message);
    this.name = "InternalError";
  }
};
var throwInternalError = message => {
  throw new InternalError(message);
};
var makeClassHandle = (prototype, record) => {
  if (!record.ptrType || !record.ptr) {
    throwInternalError("makeClassHandle requires ptr and ptrType");
  }
  var hasSmartPtrType = !!record.smartPtrType;
  var hasSmartPtr = !!record.smartPtr;
  if (hasSmartPtrType !== hasSmartPtr) {
    throwInternalError("Both smartPtrType and smartPtr must be specified");
  }
  record.count = {
    value: 1
  };
  return attachFinalizer(Object.create(prototype, {
    $$: {
      value: record,
      writable: true
    }
  }));
};

/** @suppress {globalThis} */
function RegisteredPointer_fromWireType(ptr) {
  // ptr is a raw pointer (or a raw smartpointer)
  // rawPointer is a maybe-null raw pointer
  var rawPointer = this.getPointee(ptr);
  if (!rawPointer) {
    this.destructor(ptr);
    return null;
  }
  var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
  if (undefined !== registeredInstance) {
    // JS object has been neutered, time to repopulate it
    if (0 === registeredInstance.$$.count.value) {
      registeredInstance.$$.ptr = rawPointer;
      registeredInstance.$$.smartPtr = ptr;
      return registeredInstance["clone"]();
    } else {
      // else, just increment reference count on existing object
      // it already has a reference to the smart pointer
      var rv = registeredInstance["clone"]();
      this.destructor(ptr);
      return rv;
    }
  }
  function makeDefaultHandle() {
    if (this.isSmartPointer) {
      return makeClassHandle(this.registeredClass.instancePrototype, {
        ptrType: this.pointeeType,
        ptr: rawPointer,
        smartPtrType: this,
        smartPtr: ptr
      });
    } else {
      return makeClassHandle(this.registeredClass.instancePrototype, {
        ptrType: this,
        ptr
      });
    }
  }
  var actualType = this.registeredClass.getActualType(rawPointer);
  var registeredPointerRecord = registeredPointers[actualType];
  if (!registeredPointerRecord) {
    return makeDefaultHandle.call(this);
  }
  var toType;
  if (this.isConst) {
    toType = registeredPointerRecord.constPointerType;
  } else {
    toType = registeredPointerRecord.pointerType;
  }
  var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
  if (dp === null) {
    return makeDefaultHandle.call(this);
  }
  if (this.isSmartPointer) {
    return makeClassHandle(toType.registeredClass.instancePrototype, {
      ptrType: toType,
      ptr: dp,
      smartPtrType: this,
      smartPtr: ptr
    });
  } else {
    return makeClassHandle(toType.registeredClass.instancePrototype, {
      ptrType: toType,
      ptr: dp
    });
  }
}
var attachFinalizer = handle => {
  if ("undefined" === typeof FinalizationRegistry) {
    attachFinalizer = handle => handle;
    return handle;
  }
  // If the running environment has a FinalizationRegistry (see
  // https://github.com/tc39/proposal-weakrefs), then attach finalizers
  // for class handles.  We check for the presence of FinalizationRegistry
  // at run-time, not build-time.
  finalizationRegistry = new FinalizationRegistry(info => {
    console.warn(info.leakWarning);
    releaseClassHandle(info.$$);
  });
  attachFinalizer = handle => {
    var $$ = handle.$$;
    var hasSmartPtr = !!$$.smartPtr;
    if (hasSmartPtr) {
      // We should not call the destructor on raw pointers in case other code expects the pointee to live
      var info = {
        $$
      };
      // Create a warning as an Error instance in advance so that we can store
      // the current stacktrace and point to it when / if a leak is detected.
      // This is more useful than the empty stacktrace of `FinalizationRegistry`
      // callback.
      var cls = $$.ptrType.registeredClass;
      var err = new Error("Embind found a leaked C++ instance ".concat(cls.name, " <").concat(ptrToString($$.ptr), ">.\n") + "We'll free it automatically in this case, but this functionality is not reliable across various environments.\n" + "Make sure to invoke .delete() manually once you're done with the instance instead.\n" + "Originally allocated");
      // `.stack` will add "at ..." after this sentence
      if ("captureStackTrace" in Error) {
        Error.captureStackTrace(err, RegisteredPointer_fromWireType);
      }
      info.leakWarning = err.stack.replace(/^Error: /, "");
      finalizationRegistry.register(handle, info, handle);
    }
    return handle;
  };
  detachFinalizer = handle => finalizationRegistry.unregister(handle);
  return attachFinalizer(handle);
};
var deletionQueue = [];
var flushPendingDeletes = () => {
  while (deletionQueue.length) {
    var obj = deletionQueue.pop();
    obj.$$.deleteScheduled = false;
    obj["delete"]();
  }
};
var delayFunction;
var init_ClassHandle = () => {
  let proto = ClassHandle.prototype;
  Object.assign(proto, {
    "isAliasOf"(other) {
      if (!(this instanceof ClassHandle)) {
        return false;
      }
      if (!(other instanceof ClassHandle)) {
        return false;
      }
      var leftClass = this.$$.ptrType.registeredClass;
      var left = this.$$.ptr;
      other.$$ = /** @type {Object} */other.$$;
      var rightClass = other.$$.ptrType.registeredClass;
      var right = other.$$.ptr;
      while (leftClass.baseClass) {
        left = leftClass.upcast(left);
        leftClass = leftClass.baseClass;
      }
      while (rightClass.baseClass) {
        right = rightClass.upcast(right);
        rightClass = rightClass.baseClass;
      }
      return leftClass === rightClass && left === right;
    },
    "clone"() {
      if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
      }
      if (this.$$.preservePointerOnDelete) {
        this.$$.count.value += 1;
        return this;
      } else {
        var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {
          $$: {
            value: shallowCopyInternalPointer(this.$$)
          }
        }));
        clone.$$.count.value += 1;
        clone.$$.deleteScheduled = false;
        return clone;
      }
    },
    "delete"() {
      if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
      }
      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError("Object already scheduled for deletion");
      }
      detachFinalizer(this);
      releaseClassHandle(this.$$);
      if (!this.$$.preservePointerOnDelete) {
        this.$$.smartPtr = undefined;
        this.$$.ptr = undefined;
      }
    },
    "isDeleted"() {
      return !this.$$.ptr;
    },
    "deleteLater"() {
      if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
      }
      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError("Object already scheduled for deletion");
      }
      deletionQueue.push(this);
      if (deletionQueue.length === 1 && delayFunction) {
        delayFunction(flushPendingDeletes);
      }
      this.$$.deleteScheduled = true;
      return this;
    }
  });
  // Support `using ...` from https://github.com/tc39/proposal-explicit-resource-management.
  const symbolDispose = Symbol.dispose;
  if (symbolDispose) {
    proto[symbolDispose] = proto["delete"];
  }
};

/** @constructor */
function ClassHandle() {}
var createNamedFunction = (name, func) => Object.defineProperty(func, "name", {
  value: name
});
var ensureOverloadTable = (proto, methodName, humanName) => {
  if (undefined === proto[methodName].overloadTable) {
    var prevFunc = proto[methodName];
    // Inject an overload resolver function that routes to the appropriate overload based on the number of arguments.
    proto[methodName] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      // TODO This check can be removed in -O3 level "unsafe" optimizations.
      if (!proto[methodName].overloadTable.hasOwnProperty(args.length)) {
        throwBindingError("Function '".concat(humanName, "' called with an invalid number of arguments (").concat(args.length, ") - expects one of (").concat(proto[methodName].overloadTable, ")!"));
      }
      return proto[methodName].overloadTable[args.length].apply(this, args);
    };
    // Move the previous function into the overload table.
    proto[methodName].overloadTable = [];
    proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
  }
};

/** @param {number=} numArguments */
var exposePublicSymbol = (name, value, numArguments) => {
  if (Module.hasOwnProperty(name)) {
    if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
      throwBindingError("Cannot register public name '".concat(name, "' twice"));
    }
    // We are exposing a function with the same name as an existing function. Create an overload table and a function selector
    // that routes between the two.
    ensureOverloadTable(Module, name, name);
    if (Module[name].overloadTable.hasOwnProperty(numArguments)) {
      throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (".concat(numArguments, ")!"));
    }
    // Add the new function into the overload table.
    Module[name].overloadTable[numArguments] = value;
  } else {
    Module[name] = value;
    Module[name].argCount = numArguments;
  }
};
var char_0 = 48;
var char_9 = 57;
var makeLegalFunctionName = name => {
  assert(typeof name === "string");
  name = name.replace(/[^a-zA-Z0-9_]/g, "$");
  var f = name.charCodeAt(0);
  if (f >= char_0 && f <= char_9) {
    return "_".concat(name);
  }
  return name;
};

/** @constructor */
function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
  this.name = name;
  this.constructor = constructor;
  this.instancePrototype = instancePrototype;
  this.rawDestructor = rawDestructor;
  this.baseClass = baseClass;
  this.getActualType = getActualType;
  this.upcast = upcast;
  this.downcast = downcast;
  this.pureVirtualFunctions = [];
}
var upcastPointer = (ptr, ptrClass, desiredClass) => {
  while (ptrClass !== desiredClass) {
    if (!ptrClass.upcast) {
      throwBindingError("Expected null or instance of ".concat(desiredClass.name, ", got an instance of ").concat(ptrClass.name));
    }
    ptr = ptrClass.upcast(ptr);
    ptrClass = ptrClass.baseClass;
  }
  return ptr;
};

/** @suppress {globalThis} */
function constNoSmartPtrRawPointerToWireType(destructors, handle) {
  if (handle === null) {
    if (this.isReference) {
      throwBindingError("null is not a valid ".concat(this.name));
    }
    return 0;
  }
  if (!handle.$$) {
    throwBindingError("Cannot pass \"".concat(embindRepr(handle), "\" as a ").concat(this.name));
  }
  if (!handle.$$.ptr) {
    throwBindingError("Cannot pass deleted object as a pointer of type ".concat(this.name));
  }
  var handleClass = handle.$$.ptrType.registeredClass;
  var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  return ptr;
}

/** @suppress {globalThis} */
function genericPointerToWireType(destructors, handle) {
  var ptr;
  if (handle === null) {
    if (this.isReference) {
      throwBindingError("null is not a valid ".concat(this.name));
    }
    if (this.isSmartPointer) {
      ptr = this.rawConstructor();
      if (destructors !== null) {
        destructors.push(this.rawDestructor, ptr);
      }
      return ptr;
    } else {
      return 0;
    }
  }
  if (!handle || !handle.$$) {
    throwBindingError("Cannot pass \"".concat(embindRepr(handle), "\" as a ").concat(this.name));
  }
  if (!handle.$$.ptr) {
    throwBindingError("Cannot pass deleted object as a pointer of type ".concat(this.name));
  }
  if (!this.isConst && handle.$$.ptrType.isConst) {
    throwBindingError("Cannot convert argument of type ".concat(handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name, " to parameter type ").concat(this.name));
  }
  var handleClass = handle.$$.ptrType.registeredClass;
  ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  if (this.isSmartPointer) {
    // TODO: this is not strictly true
    // We could support BY_EMVAL conversions from raw pointers to smart pointers
    // because the smart pointer can hold a reference to the handle
    if (undefined === handle.$$.smartPtr) {
      throwBindingError("Passing raw pointer to smart pointer is illegal");
    }
    switch (this.sharingPolicy) {
      case 0:
        // NONE
        // no upcasting
        if (handle.$$.smartPtrType === this) {
          ptr = handle.$$.smartPtr;
        } else {
          throwBindingError("Cannot convert argument of type ".concat(handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name, " to parameter type ").concat(this.name));
        }
        break;
      case 1:
        // INTRUSIVE
        ptr = handle.$$.smartPtr;
        break;
      case 2:
        // BY_EMVAL
        if (handle.$$.smartPtrType === this) {
          ptr = handle.$$.smartPtr;
        } else {
          var clonedHandle = handle["clone"]();
          ptr = this.rawShare(ptr, Emval.toHandle(() => clonedHandle["delete"]()));
          if (destructors !== null) {
            destructors.push(this.rawDestructor, ptr);
          }
        }
        break;
      default:
        throwBindingError("Unsupporting sharing policy");
    }
  }
  return ptr;
}

/** @suppress {globalThis} */
function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
  if (handle === null) {
    if (this.isReference) {
      throwBindingError("null is not a valid ".concat(this.name));
    }
    return 0;
  }
  if (!handle.$$) {
    throwBindingError("Cannot pass \"".concat(embindRepr(handle), "\" as a ").concat(this.name));
  }
  if (!handle.$$.ptr) {
    throwBindingError("Cannot pass deleted object as a pointer of type ".concat(this.name));
  }
  if (handle.$$.ptrType.isConst) {
    throwBindingError("Cannot convert argument of type ".concat(handle.$$.ptrType.name, " to parameter type ").concat(this.name));
  }
  var handleClass = handle.$$.ptrType.registeredClass;
  var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  return ptr;
}

/** @suppress {globalThis} */
function readPointer(pointer) {
  return this["fromWireType"](HEAPU32[pointer >>> 2 >>> 0]);
}
var init_RegisteredPointer = () => {
  Object.assign(RegisteredPointer.prototype, {
    getPointee(ptr) {
      if (this.rawGetPointee) {
        ptr = this.rawGetPointee(ptr);
      }
      return ptr;
    },
    destructor(ptr) {
      var _this$rawDestructor;
      (_this$rawDestructor = this.rawDestructor) === null || _this$rawDestructor === void 0 || _this$rawDestructor.call(this, ptr);
    },
    argPackAdvance: GenericWireTypeSize,
    "readValueFromPointer": readPointer,
    "fromWireType": RegisteredPointer_fromWireType
  });
};

/** @constructor
      @param {*=} pointeeType,
      @param {*=} sharingPolicy,
      @param {*=} rawGetPointee,
      @param {*=} rawConstructor,
      @param {*=} rawShare,
      @param {*=} rawDestructor,
       */
function RegisteredPointer(name, registeredClass, isReference, isConst,
// smart pointer properties
isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
  this.name = name;
  this.registeredClass = registeredClass;
  this.isReference = isReference;
  this.isConst = isConst;
  // smart pointer properties
  this.isSmartPointer = isSmartPointer;
  this.pointeeType = pointeeType;
  this.sharingPolicy = sharingPolicy;
  this.rawGetPointee = rawGetPointee;
  this.rawConstructor = rawConstructor;
  this.rawShare = rawShare;
  this.rawDestructor = rawDestructor;
  if (!isSmartPointer && registeredClass.baseClass === undefined) {
    if (isConst) {
      this["toWireType"] = constNoSmartPtrRawPointerToWireType;
      this.destructorFunction = null;
    } else {
      this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
      this.destructorFunction = null;
    }
  } else {
    this["toWireType"] = genericPointerToWireType;
  }
}

/** @param {number=} numArguments */
var replacePublicSymbol = (name, value, numArguments) => {
  if (!Module.hasOwnProperty(name)) {
    throwInternalError("Replacing nonexistent public symbol");
  }
  // If there's an overload table for this symbol, replace the symbol in the overload table instead.
  if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
    Module[name].overloadTable[numArguments] = value;
  } else {
    Module[name] = value;
    Module[name].argCount = numArguments;
  }
};
var dynCallLegacy = (sig, ptr, args) => {
  sig = sig.replace(/p/g, "i");
  assert("dynCall_" + sig in Module, "bad function pointer type - dynCall function not found for sig '".concat(sig, "'"));
  if (args !== null && args !== void 0 && args.length) {
    // j (64-bit integer) must be passed in as two numbers [low 32, high 32].
    assert(args.length === sig.substring(1).replace(/j/g, "--").length);
  } else {
    assert(sig.length == 1);
  }
  var f = Module["dynCall_" + sig];
  return f(ptr, ...args);
};
var dynCall = function (sig, ptr) {
  let args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  let promising = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  assert(!promising, "async dynCall is not supported in this mode");
  var rtn = dynCallLegacy(sig, ptr, args);
  return sig[0] == "p" ? rtn >>> 0 : rtn;
};
var getDynCaller = function (sig, ptr) {
  let promising = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  return function () {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    return dynCall(sig, ptr, args, promising);
  };
};
var embind__requireFunction = function (signature, rawFunction) {
  let isAsync = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  assert(!isAsync, "Async bindings are only supported with JSPI.");
  signature = readLatin1String(signature);
  function makeDynCaller() {
    return getDynCaller(signature, rawFunction);
  }
  var fp = makeDynCaller();
  if (typeof fp != "function") {
    throwBindingError("unknown function pointer with signature ".concat(signature, ": ").concat(rawFunction));
  }
  return fp;
};
class UnboundTypeError extends Error {}
var getTypeName = type => {
  var ptr = ___getTypeName(type);
  var rv = readLatin1String(ptr);
  _free(ptr);
  return rv;
};
var throwUnboundTypeError = (message, types) => {
  var unboundTypes = [];
  var seen = {};
  function visit(type) {
    if (seen[type]) {
      return;
    }
    if (registeredTypes[type]) {
      return;
    }
    if (typeDependencies[type]) {
      typeDependencies[type].forEach(visit);
      return;
    }
    unboundTypes.push(type);
    seen[type] = true;
  }
  types.forEach(visit);
  throw new UnboundTypeError("".concat(message, ": ") + unboundTypes.map(getTypeName).join([", "]));
};
var whenDependentTypesAreResolved = (myTypes, dependentTypes, getTypeConverters) => {
  myTypes.forEach(type => typeDependencies[type] = dependentTypes);
  function onComplete(typeConverters) {
    var myTypeConverters = getTypeConverters(typeConverters);
    if (myTypeConverters.length !== myTypes.length) {
      throwInternalError("Mismatched type converter count");
    }
    for (var i = 0; i < myTypes.length; ++i) {
      registerType(myTypes[i], myTypeConverters[i]);
    }
  }
  var typeConverters = new Array(dependentTypes.length);
  var unregisteredTypes = [];
  var registered = 0;
  dependentTypes.forEach((dt, i) => {
    if (registeredTypes.hasOwnProperty(dt)) {
      typeConverters[i] = registeredTypes[dt];
    } else {
      unregisteredTypes.push(dt);
      if (!awaitingDependencies.hasOwnProperty(dt)) {
        awaitingDependencies[dt] = [];
      }
      awaitingDependencies[dt].push(() => {
        typeConverters[i] = registeredTypes[dt];
        ++registered;
        if (registered === unregisteredTypes.length) {
          onComplete(typeConverters);
        }
      });
    }
  });
  if (0 === unregisteredTypes.length) {
    onComplete(typeConverters);
  }
};
function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
  rawType >>>= 0;
  rawPointerType >>>= 0;
  rawConstPointerType >>>= 0;
  baseClassRawType >>>= 0;
  getActualTypeSignature >>>= 0;
  getActualType >>>= 0;
  upcastSignature >>>= 0;
  upcast >>>= 0;
  downcastSignature >>>= 0;
  downcast >>>= 0;
  name >>>= 0;
  destructorSignature >>>= 0;
  rawDestructor >>>= 0;
  name = readLatin1String(name);
  getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
  upcast && (upcast = embind__requireFunction(upcastSignature, upcast));
  downcast && (downcast = embind__requireFunction(downcastSignature, downcast));
  rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
  var legalFunctionName = makeLegalFunctionName(name);
  exposePublicSymbol(legalFunctionName, function () {
    // this code cannot run if baseClassRawType is zero
    throwUnboundTypeError("Cannot construct ".concat(name, " due to unbound types"), [baseClassRawType]);
  });
  whenDependentTypesAreResolved([rawType, rawPointerType, rawConstPointerType], baseClassRawType ? [baseClassRawType] : [], base => {
    base = base[0];
    var baseClass;
    var basePrototype;
    if (baseClassRawType) {
      baseClass = base.registeredClass;
      basePrototype = baseClass.instancePrototype;
    } else {
      basePrototype = ClassHandle.prototype;
    }
    var constructor = createNamedFunction(name, function () {
      if (Object.getPrototypeOf(this) !== instancePrototype) {
        throw new BindingError("Use 'new' to construct ".concat(name));
      }
      if (undefined === registeredClass.constructor_body) {
        throw new BindingError("".concat(name, " has no accessible constructor"));
      }
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }
      var body = registeredClass.constructor_body[args.length];
      if (undefined === body) {
        throw new BindingError("Tried to invoke ctor of ".concat(name, " with invalid number of parameters (").concat(args.length, ") - expected (").concat(Object.keys(registeredClass.constructor_body).toString(), ") parameters instead!"));
      }
      return body.apply(this, args);
    });
    var instancePrototype = Object.create(basePrototype, {
      constructor: {
        value: constructor
      }
    });
    constructor.prototype = instancePrototype;
    var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
    if (registeredClass.baseClass) {
      var _registeredClass$base, _registeredClass$base2;
      // Keep track of class hierarchy. Used to allow sub-classes to inherit class functions.
      (_registeredClass$base2 = (_registeredClass$base = registeredClass.baseClass).__derivedClasses) !== null && _registeredClass$base2 !== void 0 ? _registeredClass$base2 : _registeredClass$base.__derivedClasses = [];
      registeredClass.baseClass.__derivedClasses.push(registeredClass);
    }
    var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
    var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
    var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
    registeredPointers[rawType] = {
      pointerType: pointerConverter,
      constPointerType: constPointerConverter
    };
    replacePublicSymbol(legalFunctionName, constructor);
    return [referenceConverter, pointerConverter, constPointerConverter];
  });
}
var heap32VectorToArray = (count, firstElement) => {
  var array = [];
  for (var i = 0; i < count; i++) {
    // TODO(https://github.com/emscripten-core/emscripten/issues/17310):
    // Find a way to hoist the `>> 2` or `>> 3` out of this loop.
    array.push(HEAPU32[firstElement + i * 4 >>> 2 >>> 0]);
  }
  return array;
};
var runDestructors = destructors => {
  while (destructors.length) {
    var ptr = destructors.pop();
    var del = destructors.pop();
    del(ptr);
  }
};
function usesDestructorStack(argTypes) {
  // Skip return value at index 0 - it's not deleted here.
  for (var i = 1; i < argTypes.length; ++i) {
    // The type does not define a destructor function - must use dynamic stack
    if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
      return true;
    }
  }
  return false;
}
function checkArgCount(numArgs, minArgs, maxArgs, humanName, throwBindingError) {
  if (numArgs < minArgs || numArgs > maxArgs) {
    var argCountMessage = minArgs == maxArgs ? minArgs : "".concat(minArgs, " to ").concat(maxArgs);
    throwBindingError("function ".concat(humanName, " called with ").concat(numArgs, " arguments, expected ").concat(argCountMessage));
  }
}
function createJsInvoker(argTypes, isClassMethodFunc, returns, isAsync) {
  var needsDestructorStack = usesDestructorStack(argTypes);
  var argCount = argTypes.length - 2;
  var argsList = [];
  var argsListWired = ["fn"];
  if (isClassMethodFunc) {
    argsListWired.push("thisWired");
  }
  for (var i = 0; i < argCount; ++i) {
    argsList.push("arg".concat(i));
    argsListWired.push("arg".concat(i, "Wired"));
  }
  argsList = argsList.join(",");
  argsListWired = argsListWired.join(",");
  var invokerFnBody = "return function (".concat(argsList, ") {\n");
  invokerFnBody += "checkArgCount(arguments.length, minArgs, maxArgs, humanName, throwBindingError);\n";
  if (needsDestructorStack) {
    invokerFnBody += "var destructors = [];\n";
  }
  var dtorStack = needsDestructorStack ? "destructors" : "null";
  var args1 = ["humanName", "throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
  if (isClassMethodFunc) {
    invokerFnBody += "var thisWired = classParam['toWireType'](".concat(dtorStack, ", this);\n");
  }
  for (var i = 0; i < argCount; ++i) {
    invokerFnBody += "var arg".concat(i, "Wired = argType").concat(i, "['toWireType'](").concat(dtorStack, ", arg").concat(i, ");\n");
    args1.push("argType".concat(i));
  }
  invokerFnBody += (returns || isAsync ? "var rv = " : "") + "invoker(".concat(argsListWired, ");\n");
  var returnVal = returns ? "rv" : "";
  args1.push("Asyncify");
  invokerFnBody += "function onDone(".concat(returnVal, ") {\n");
  if (needsDestructorStack) {
    invokerFnBody += "runDestructors(destructors);\n";
  } else {
    for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
      // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
      var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
      if (argTypes[i].destructorFunction !== null) {
        invokerFnBody += "".concat(paramName, "_dtor(").concat(paramName, ");\n");
        args1.push("".concat(paramName, "_dtor"));
      }
    }
  }
  if (returns) {
    invokerFnBody += "var ret = retType['fromWireType'](rv);\n" + "return ret;\n";
  } else {}
  invokerFnBody += "}\n";
  invokerFnBody += "return Asyncify.currData ? Asyncify.whenDone().then(onDone) : onDone(".concat(returnVal, ");\n");
  invokerFnBody += "}\n";
  args1.push("checkArgCount", "minArgs", "maxArgs");
  invokerFnBody = "if (arguments.length !== ".concat(args1.length, "){ throw new Error(humanName + \"Expected ").concat(args1.length, " closure arguments \" + arguments.length + \" given.\"); }\n").concat(invokerFnBody);
  return [args1, invokerFnBody];
}
var runAndAbortIfError = func => {
  try {
    return func();
  } catch (e) {
    abort(e);
  }
};
var handleException = e => {
  // Certain exception types we do not treat as errors since they are used for
  // internal control flow.
  // 1. ExitStatus, which is thrown by exit()
  // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
  //    that wish to return to JS event loop.
  if (e instanceof ExitStatus || e == "unwind") {
    return EXITSTATUS;
  }
  checkStackCookie();
  if (e instanceof WebAssembly.RuntimeError) {
    if (_emscripten_stack_get_current() <= 0) {
      err("Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 65536)");
    }
  }
  quit_(1, e);
};
var runtimeKeepaliveCounter = 0;
var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
var _proc_exit = code => {
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    var _Module$onExit;
    (_Module$onExit = Module["onExit"]) === null || _Module$onExit === void 0 || _Module$onExit.call(Module, code);
    ABORT = true;
  }
  quit_(code, new ExitStatus(code));
};

/** @suppress {duplicate } */ /** @param {boolean|number=} implicit */
var exitJS = (status, implicit) => {
  EXITSTATUS = status;
  checkUnflushedContent();
  // if exit() was called explicitly, warn the user if the runtime isn't actually being shut down
  if (keepRuntimeAlive() && !implicit) {
    var msg = "program exited (with status: ".concat(status, "), but keepRuntimeAlive() is set (counter=").concat(runtimeKeepaliveCounter, ") due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)");
    readyPromiseReject(msg);
    err(msg);
  }
  _proc_exit(status);
};
var _exit = exitJS;
var maybeExit = () => {
  if (!keepRuntimeAlive()) {
    try {
      _exit(EXITSTATUS);
    } catch (e) {
      handleException(e);
    }
  }
};
var callUserCallback = func => {
  if (ABORT) {
    err("user callback triggered after runtime exited or application aborted.  Ignoring.");
    return;
  }
  try {
    func();
    maybeExit();
  } catch (e) {
    handleException(e);
  }
};
var sigToWasmTypes = sig => {
  assert(!sig.includes("j"), "i64 not permitted in function signatures when WASM_BIGINT is disabled");
  var typeNames = {
    "i": "i32",
    "j": "i64",
    "f": "f32",
    "d": "f64",
    "e": "externref",
    "p": "i32"
  };
  var type = {
    parameters: [],
    results: sig[0] == "v" ? [] : [typeNames[sig[0]]]
  };
  for (var i = 1; i < sig.length; ++i) {
    assert(sig[i] in typeNames, "invalid signature char: " + sig[i]);
    type.parameters.push(typeNames[sig[i]]);
  }
  return type;
};
var runtimeKeepalivePush = () => {
  runtimeKeepaliveCounter += 1;
};
var runtimeKeepalivePop = () => {
  assert(runtimeKeepaliveCounter > 0);
  runtimeKeepaliveCounter -= 1;
};
var Asyncify = {
  instrumentWasmImports(imports) {
    var importPattern = /^(invoke_.*|__asyncjs__.*)$/;
    for (let [x, original] of Object.entries(imports)) {
      if (typeof original == "function") {
        let isAsyncifyImport = original.isAsync || importPattern.test(x);
        imports[x] = function () {
          var originalAsyncifyState = Asyncify.state;
          try {
            return original(...arguments);
          } finally {
            // Only asyncify-declared imports are allowed to change the
            // state.
            // Changing the state from normal to disabled is allowed (in any
            // function) as that is what shutdown does (and we don't have an
            // explicit list of shutdown imports).
            var changedToDisabled = originalAsyncifyState === Asyncify.State.Normal && Asyncify.state === Asyncify.State.Disabled;
            // invoke_* functions are allowed to change the state if we do
            // not ignore indirect calls.
            var ignoredInvoke = x.startsWith("invoke_") && true;
            if (Asyncify.state !== originalAsyncifyState && !isAsyncifyImport && !changedToDisabled && !ignoredInvoke) {
              throw new Error("import ".concat(x, " was not in ASYNCIFY_IMPORTS, but changed the state"));
            }
          }
        };
      }
    }
  },
  instrumentWasmExports(exports) {
    var ret = {};
    for (let [x, original] of Object.entries(exports)) {
      if (typeof original == "function") {
        ret[x] = function () {
          Asyncify.exportCallStack.push(x);
          try {
            return original(...arguments);
          } finally {
            if (!ABORT) {
              var y = Asyncify.exportCallStack.pop();
              assert(y === x);
              Asyncify.maybeStopUnwind();
            }
          }
        };
      } else {
        ret[x] = original;
      }
    }
    return ret;
  },
  State: {
    Normal: 0,
    Unwinding: 1,
    Rewinding: 2,
    Disabled: 3
  },
  state: 0,
  StackSize: 4096,
  currData: null,
  handleSleepReturnValue: 0,
  exportCallStack: [],
  callStackNameToId: {},
  callStackIdToName: {},
  callStackId: 0,
  asyncPromiseHandlers: null,
  sleepCallbacks: [],
  getCallStackId(funcName) {
    var id = Asyncify.callStackNameToId[funcName];
    if (id === undefined) {
      id = Asyncify.callStackId++;
      Asyncify.callStackNameToId[funcName] = id;
      Asyncify.callStackIdToName[id] = funcName;
    }
    return id;
  },
  maybeStopUnwind() {
    if (Asyncify.currData && Asyncify.state === Asyncify.State.Unwinding && Asyncify.exportCallStack.length === 0) {
      // We just finished unwinding.
      // Be sure to set the state before calling any other functions to avoid
      // possible infinite recursion here (For example in debug pthread builds
      // the dbg() function itself can call back into WebAssembly to get the
      // current pthread_self() pointer).
      Asyncify.state = Asyncify.State.Normal;
      // Keep the runtime alive so that a re-wind can be done later.
      runAndAbortIfError(_asyncify_stop_unwind);
      if (typeof Fibers != "undefined") {
        Fibers.trampoline();
      }
    }
  },
  whenDone() {
    assert(Asyncify.currData, "Tried to wait for an async operation when none is in progress.");
    assert(!Asyncify.asyncPromiseHandlers, "Cannot have multiple async operations in flight at once");
    return new Promise((resolve, reject) => {
      Asyncify.asyncPromiseHandlers = {
        resolve,
        reject
      };
    });
  },
  allocateData() {
    // An asyncify data structure has three fields:
    //  0  current stack pos
    //  4  max stack pos
    //  8  id of function at bottom of the call stack (callStackIdToName[id] == name of js function)
    // The Asyncify ABI only interprets the first two fields, the rest is for the runtime.
    // We also embed a stack in the same memory region here, right next to the structure.
    // This struct is also defined as asyncify_data_t in emscripten/fiber.h
    var ptr = _malloc(12 + Asyncify.StackSize);
    Asyncify.setDataHeader(ptr, ptr + 12, Asyncify.StackSize);
    Asyncify.setDataRewindFunc(ptr);
    return ptr;
  },
  setDataHeader(ptr, stack, stackSize) {
    HEAPU32[ptr >>> 2 >>> 0] = stack;
    HEAPU32[ptr + 4 >>> 2 >>> 0] = stack + stackSize;
  },
  setDataRewindFunc(ptr) {
    var bottomOfCallStack = Asyncify.exportCallStack[0];
    var rewindId = Asyncify.getCallStackId(bottomOfCallStack);
    HEAP32[ptr + 8 >>> 2 >>> 0] = rewindId;
  },
  getDataRewindFuncName(ptr) {
    var id = HEAP32[ptr + 8 >>> 2 >>> 0];
    var name = Asyncify.callStackIdToName[id];
    return name;
  },
  getDataRewindFunc(name) {
    var func = wasmExports[name];
    return func;
  },
  doRewind(ptr) {
    var name = Asyncify.getDataRewindFuncName(ptr);
    var func = Asyncify.getDataRewindFunc(name);
    // Once we have rewound and the stack we no longer need to artificially
    // keep the runtime alive.
    return func();
  },
  handleSleep(startAsync) {
    assert(Asyncify.state !== Asyncify.State.Disabled, "Asyncify cannot be done during or after the runtime exits");
    if (ABORT) return;
    if (Asyncify.state === Asyncify.State.Normal) {
      // Prepare to sleep. Call startAsync, and see what happens:
      // if the code decided to call our callback synchronously,
      // then no async operation was in fact begun, and we don't
      // need to do anything.
      var reachedCallback = false;
      var reachedAfterCallback = false;
      startAsync(function () {
        let handleSleepReturnValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        assert(!handleSleepReturnValue || typeof handleSleepReturnValue == "number" || typeof handleSleepReturnValue == "boolean");
        // old emterpretify API supported other stuff
        if (ABORT) return;
        Asyncify.handleSleepReturnValue = handleSleepReturnValue;
        reachedCallback = true;
        if (!reachedAfterCallback) {
          // We are happening synchronously, so no need for async.
          return;
        }
        // This async operation did not happen synchronously, so we did
        // unwind. In that case there can be no compiled code on the stack,
        // as it might break later operations (we can rewind ok now, but if
        // we unwind again, we would unwind through the extra compiled code
        // too).
        assert(!Asyncify.exportCallStack.length, "Waking up (starting to rewind) must be done from JS, without compiled code on the stack.");
        Asyncify.state = Asyncify.State.Rewinding;
        runAndAbortIfError(() => _asyncify_start_rewind(Asyncify.currData));
        if (typeof MainLoop != "undefined" && MainLoop.func) {
          MainLoop.resume();
        }
        var asyncWasmReturnValue,
          isError = false;
        try {
          asyncWasmReturnValue = Asyncify.doRewind(Asyncify.currData);
        } catch (err) {
          asyncWasmReturnValue = err;
          isError = true;
        }
        // Track whether the return value was handled by any promise handlers.
        var handled = false;
        if (!Asyncify.currData) {
          // All asynchronous execution has finished.
          // `asyncWasmReturnValue` now contains the final
          // return value of the exported async WASM function.
          // Note: `asyncWasmReturnValue` is distinct from
          // `Asyncify.handleSleepReturnValue`.
          // `Asyncify.handleSleepReturnValue` contains the return
          // value of the last C function to have executed
          // `Asyncify.handleSleep()`, where as `asyncWasmReturnValue`
          // contains the return value of the exported WASM function
          // that may have called C functions that
          // call `Asyncify.handleSleep()`.
          var asyncPromiseHandlers = Asyncify.asyncPromiseHandlers;
          if (asyncPromiseHandlers) {
            Asyncify.asyncPromiseHandlers = null;
            (isError ? asyncPromiseHandlers.reject : asyncPromiseHandlers.resolve)(asyncWasmReturnValue);
            handled = true;
          }
        }
        if (isError && !handled) {
          // If there was an error and it was not handled by now, we have no choice but to
          // rethrow that error into the global scope where it can be caught only by
          // `onerror` or `onunhandledpromiserejection`.
          throw asyncWasmReturnValue;
        }
      });
      reachedAfterCallback = true;
      if (!reachedCallback) {
        // A true async operation was begun; start a sleep.
        Asyncify.state = Asyncify.State.Unwinding;
        // TODO: reuse, don't alloc/free every sleep
        Asyncify.currData = Asyncify.allocateData();
        if (typeof MainLoop != "undefined" && MainLoop.func) {
          MainLoop.pause();
        }
        runAndAbortIfError(() => _asyncify_start_unwind(Asyncify.currData));
      }
    } else if (Asyncify.state === Asyncify.State.Rewinding) {
      // Stop a resume.
      Asyncify.state = Asyncify.State.Normal;
      runAndAbortIfError(_asyncify_stop_rewind);
      _free(Asyncify.currData);
      Asyncify.currData = null;
      // Call all sleep callbacks now that the sleep-resume is all done.
      Asyncify.sleepCallbacks.forEach(callUserCallback);
    } else {
      abort("invalid state: ".concat(Asyncify.state));
    }
    return Asyncify.handleSleepReturnValue;
  },
  handleAsync(startAsync) {
    return Asyncify.handleSleep(wakeUp => {
      // TODO: add error handling as a second param when handleSleep implements it.
      startAsync().then(wakeUp);
    });
  }
};
function getRequiredArgCount(argTypes) {
  var requiredArgCount = argTypes.length - 2;
  for (var i = argTypes.length - 1; i >= 2; --i) {
    if (!argTypes[i].optional) {
      break;
    }
    requiredArgCount--;
  }
  return requiredArgCount;
}
function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc, /** boolean= */isAsync) {
  // humanName: a human-readable string name for the function to be generated.
  // argTypes: An array that contains the embind type objects for all types in the function signature.
  //    argTypes[0] is the type object for the function return value.
  //    argTypes[1] is the type object for function this object/class type, or null if not crafting an invoker for a class method.
  //    argTypes[2...] are the actual function parameters.
  // classType: The embind type object for the class to be bound, or null if this is not a method of a class.
  // cppInvokerFunc: JS Function object to the C++-side function that interops into C++ code.
  // cppTargetFunc: Function pointer (an integer to FUNCTION_TABLE) to the target C++ function the cppInvokerFunc will end up calling.
  // isAsync: Optional. If true, returns an async function. Async bindings are only supported with JSPI.
  var argCount = argTypes.length;
  if (argCount < 2) {
    throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
  }
  assert(!isAsync, "Async bindings are only supported with JSPI.");
  var isClassMethodFunc = argTypes[1] !== null && classType !== null;
  // Free functions with signature "void function()" do not need an invoker that marshalls between wire types.
  // TODO: This omits argument count check - enable only at -O3 or similar.
  //    if (ENABLE_UNSAFE_OPTS && argCount == 2 && argTypes[0].name == "void" && !isClassMethodFunc) {
  //       return FUNCTION_TABLE[fn];
  //    }
  // Determine if we need to use a dynamic stack to store the destructors for the function parameters.
  // TODO: Remove this completely once all function invokers are being dynamically generated.
  var needsDestructorStack = usesDestructorStack(argTypes);
  var returns = argTypes[0].name !== "void";
  var expectedArgCount = argCount - 2;
  var minArgs = getRequiredArgCount(argTypes);
  // Builld the arguments that will be passed into the closure around the invoker
  // function.
  var closureArgs = [humanName, throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
  for (var i = 0; i < argCount - 2; ++i) {
    closureArgs.push(argTypes[i + 2]);
  }
  closureArgs.push(Asyncify);
  if (!needsDestructorStack) {
    // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
    for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
      if (argTypes[i].destructorFunction !== null) {
        closureArgs.push(argTypes[i].destructorFunction);
      }
    }
  }
  closureArgs.push(checkArgCount, minArgs, expectedArgCount);
  let [args, invokerFnBody] = createJsInvoker(argTypes, isClassMethodFunc, returns, isAsync);
  var invokerFn = new Function(...args, invokerFnBody)(...closureArgs);
  return createNamedFunction(humanName, invokerFn);
}
var __embind_register_class_constructor = function (rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
  rawClassType >>>= 0;
  rawArgTypesAddr >>>= 0;
  invokerSignature >>>= 0;
  invoker >>>= 0;
  rawConstructor >>>= 0;
  assert(argCount > 0);
  var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
  invoker = embind__requireFunction(invokerSignature, invoker);
  var args = [rawConstructor];
  var destructors = [];
  whenDependentTypesAreResolved([], [rawClassType], classType => {
    classType = classType[0];
    var humanName = "constructor ".concat(classType.name);
    if (undefined === classType.registeredClass.constructor_body) {
      classType.registeredClass.constructor_body = [];
    }
    if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
      throw new BindingError("Cannot register multiple constructors with identical number of parameters (".concat(argCount - 1, ") for class '").concat(classType.name, "'! Overload resolution is currently only performed using the parameter count, not actual type info!"));
    }
    classType.registeredClass.constructor_body[argCount - 1] = () => {
      throwUnboundTypeError("Cannot construct ".concat(classType.name, " due to unbound types"), rawArgTypes);
    };
    whenDependentTypesAreResolved([], rawArgTypes, argTypes => {
      // Insert empty slot for context type (argTypes[1]).
      argTypes.splice(1, 0, null);
      classType.registeredClass.constructor_body[argCount - 1] = craftInvokerFunction(humanName, argTypes, null, invoker, rawConstructor);
      return [];
    });
    return [];
  });
};
var getFunctionName = signature => {
  signature = signature.trim();
  const argsIndex = signature.indexOf("(");
  if (argsIndex === -1) return signature;
  assert(signature.endsWith(")"), "Parentheses for argument names should match.");
  return signature.slice(0, argsIndex);
};
var __embind_register_class_function = function (rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual, isAsync, isNonnullReturn) {
  rawClassType >>>= 0;
  methodName >>>= 0;
  rawArgTypesAddr >>>= 0;
  invokerSignature >>>= 0;
  rawInvoker >>>= 0;
  context >>>= 0;
  var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
  methodName = readLatin1String(methodName);
  methodName = getFunctionName(methodName);
  rawInvoker = embind__requireFunction(invokerSignature, rawInvoker, isAsync);
  whenDependentTypesAreResolved([], [rawClassType], classType => {
    classType = classType[0];
    var humanName = "".concat(classType.name, ".").concat(methodName);
    if (methodName.startsWith("@@")) {
      methodName = Symbol[methodName.substring(2)];
    }
    if (isPureVirtual) {
      classType.registeredClass.pureVirtualFunctions.push(methodName);
    }
    function unboundTypesHandler() {
      throwUnboundTypeError("Cannot call ".concat(humanName, " due to unbound types"), rawArgTypes);
    }
    var proto = classType.registeredClass.instancePrototype;
    var method = proto[methodName];
    if (undefined === method || undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
      // This is the first overload to be registered, OR we are replacing a
      // function in the base class with a function in the derived class.
      unboundTypesHandler.argCount = argCount - 2;
      unboundTypesHandler.className = classType.name;
      proto[methodName] = unboundTypesHandler;
    } else {
      // There was an existing function with the same name registered. Set up
      // a function overload routing table.
      ensureOverloadTable(proto, methodName, humanName);
      proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
    }
    whenDependentTypesAreResolved([], rawArgTypes, argTypes => {
      var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context, isAsync);
      // Replace the initial unbound-handler-stub function with the
      // appropriate member function, now that all types are resolved. If
      // multiple overloads are registered for this function, the function
      // goes into an overload table.
      if (undefined === proto[methodName].overloadTable) {
        // Set argCount in case an overload is registered later
        memberFunction.argCount = argCount - 2;
        proto[methodName] = memberFunction;
      } else {
        proto[methodName].overloadTable[argCount - 2] = memberFunction;
      }
      return [];
    });
    return [];
  });
};
var emval_freelist = [];
var emval_handles = [];
function __emval_decref(handle) {
  handle >>>= 0;
  if (handle > 9 && 0 === --emval_handles[handle + 1]) {
    assert(emval_handles[handle] !== undefined, "Decref for unallocated handle.");
    emval_handles[handle] = undefined;
    emval_freelist.push(handle);
  }
}
var count_emval_handles = () => emval_handles.length / 2 - 5 - emval_freelist.length;
var init_emval = () => {
  // reserve 0 and some special values. These never get de-allocated.
  emval_handles.push(0, 1, undefined, 1, null, 1, true, 1, false, 1);
  assert(emval_handles.length === 5 * 2);
  Module["count_emval_handles"] = count_emval_handles;
};
var Emval = {
  toValue: handle => {
    if (!handle) {
      throwBindingError("Cannot use deleted val. handle = ".concat(handle));
    }
    // handle 2 is supposed to be `undefined`.
    assert(handle === 2 || emval_handles[handle] !== undefined && handle % 2 === 0, "invalid handle: ".concat(handle));
    return emval_handles[handle];
  },
  toHandle: value => {
    switch (value) {
      case undefined:
        return 2;
      case null:
        return 4;
      case true:
        return 6;
      case false:
        return 8;
      default:
        {
          const handle = emval_freelist.pop() || emval_handles.length;
          emval_handles[handle] = value;
          emval_handles[handle + 1] = 1;
          return handle;
        }
    }
  }
};
var EmValType = {
  name: "emscripten::val",
  "fromWireType": handle => {
    var rv = Emval.toValue(handle);
    __emval_decref(handle);
    return rv;
  },
  "toWireType": (destructors, value) => Emval.toHandle(value),
  argPackAdvance: GenericWireTypeSize,
  "readValueFromPointer": readPointer,
  destructorFunction: null
};
function __embind_register_emval(rawType) {
  rawType >>>= 0;
  return registerType(rawType, EmValType);
}
var floatReadValueFromPointer = (name, width) => {
  switch (width) {
    case 4:
      return function (pointer) {
        return this["fromWireType"](HEAPF32[pointer >>> 2 >>> 0]);
      };
    case 8:
      return function (pointer) {
        return this["fromWireType"](HEAPF64[pointer >>> 3 >>> 0]);
      };
    default:
      throw new TypeError("invalid float width (".concat(width, "): ").concat(name));
  }
};
var embindRepr = v => {
  if (v === null) {
    return "null";
  }
  var t = typeof v;
  if (t === "object" || t === "array" || t === "function") {
    return v.toString();
  } else {
    return "" + v;
  }
};
var __embind_register_float = function (rawType, name, size) {
  rawType >>>= 0;
  name >>>= 0;
  size >>>= 0;
  name = readLatin1String(name);
  registerType(rawType, {
    name,
    "fromWireType": value => value,
    "toWireType": (destructors, value) => {
      if (typeof value != "number" && typeof value != "boolean") {
        throw new TypeError("Cannot convert ".concat(embindRepr(value), " to ").concat(this.name));
      }
      // The VM will perform JS to Wasm value conversion, according to the spec:
      // https://www.w3.org/TR/wasm-js-api-1/#towebassemblyvalue
      return value;
    },
    argPackAdvance: GenericWireTypeSize,
    "readValueFromPointer": floatReadValueFromPointer(name, size),
    destructorFunction: null
  });
};
function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn, isAsync, isNonnullReturn) {
  name >>>= 0;
  rawArgTypesAddr >>>= 0;
  signature >>>= 0;
  rawInvoker >>>= 0;
  fn >>>= 0;
  var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
  name = readLatin1String(name);
  name = getFunctionName(name);
  rawInvoker = embind__requireFunction(signature, rawInvoker, isAsync);
  exposePublicSymbol(name, function () {
    throwUnboundTypeError("Cannot call ".concat(name, " due to unbound types"), argTypes);
  }, argCount - 1);
  whenDependentTypesAreResolved([], argTypes, argTypes => {
    var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
    replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn, isAsync), argCount - 1);
    return [];
  });
}
var integerReadValueFromPointer = (name, width, signed) => {
  // integers are quite common, so generate very specialized functions
  switch (width) {
    case 1:
      return signed ? pointer => HEAP8[pointer >>> 0] : pointer => HEAPU8[pointer >>> 0];
    case 2:
      return signed ? pointer => HEAP16[pointer >>> 1 >>> 0] : pointer => HEAPU16[pointer >>> 1 >>> 0];
    case 4:
      return signed ? pointer => HEAP32[pointer >>> 2 >>> 0] : pointer => HEAPU32[pointer >>> 2 >>> 0];
    default:
      throw new TypeError("invalid integer width (".concat(width, "): ").concat(name));
  }
};

/** @suppress {globalThis} */
function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
  primitiveType >>>= 0;
  name >>>= 0;
  size >>>= 0;
  name = readLatin1String(name);
  // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come
  // out as 'i32 -1'. Always treat those as max u32.
  if (maxRange === -1) {
    maxRange = 4294967295;
  }
  var fromWireType = value => value;
  if (minRange === 0) {
    var bitshift = 32 - 8 * size;
    fromWireType = value => value << bitshift >>> bitshift;
  }
  var isUnsignedType = name.includes("unsigned");
  var checkAssertions = (value, toTypeName) => {
    if (typeof value != "number" && typeof value != "boolean") {
      throw new TypeError("Cannot convert \"".concat(embindRepr(value), "\" to ").concat(toTypeName));
    }
    if (value < minRange || value > maxRange) {
      throw new TypeError("Passing a number \"".concat(embindRepr(value), "\" from JS side to C/C++ side to an argument of type \"").concat(name, "\", which is outside the valid range [").concat(minRange, ", ").concat(maxRange, "]!"));
    }
  };
  var toWireType;
  if (isUnsignedType) {
    toWireType = function (destructors, value) {
      checkAssertions(value, this.name);
      return value >>> 0;
    };
  } else {
    toWireType = function (destructors, value) {
      checkAssertions(value, this.name);
      // The VM will perform JS to Wasm value conversion, according to the spec:
      // https://www.w3.org/TR/wasm-js-api-1/#towebassemblyvalue
      return value;
    };
  }
  registerType(primitiveType, {
    name,
    "fromWireType": fromWireType,
    "toWireType": toWireType,
    argPackAdvance: GenericWireTypeSize,
    "readValueFromPointer": integerReadValueFromPointer(name, size, minRange !== 0),
    destructorFunction: null
  });
}
function __embind_register_memory_view(rawType, dataTypeIndex, name) {
  rawType >>>= 0;
  name >>>= 0;
  var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
  var TA = typeMapping[dataTypeIndex];
  function decodeMemoryView(handle) {
    var size = HEAPU32[handle >>> 2 >>> 0];
    var data = HEAPU32[handle + 4 >>> 2 >>> 0];
    return new TA(HEAP8.buffer, data, size);
  }
  name = readLatin1String(name);
  registerType(rawType, {
    name,
    "fromWireType": decodeMemoryView,
    argPackAdvance: GenericWireTypeSize,
    "readValueFromPointer": decodeMemoryView
  }, {
    ignoreDuplicateRegistrations: true
  });
}
var EmValOptionalType = Object.assign({
  optional: true
}, EmValType);
function __embind_register_optional(rawOptionalType, rawType) {
  rawOptionalType >>>= 0;
  rawType >>>= 0;
  registerType(rawOptionalType, EmValOptionalType);
}
var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
  outIdx >>>= 0;
  assert(typeof str === "string", "stringToUTF8Array expects a string (got ".concat(typeof str, ")"));
  // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
  // undefined and false each don't write out any bytes.
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
    // unit, not a Unicode code point of the character! So decode
    // UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
    // and https://www.ietf.org/rfc/rfc2279.txt
    // and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i);
    // possibly a lead surrogate
    if (u >= 55296 && u <= 57343) {
      var u1 = str.charCodeAt(++i);
      u = 65536 + ((u & 1023) << 10) | u1 & 1023;
    }
    if (u <= 127) {
      if (outIdx >= endIdx) break;
      heap[outIdx++ >>> 0] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++ >>> 0] = 192 | u >> 6;
      heap[outIdx++ >>> 0] = 128 | u & 63;
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++ >>> 0] = 224 | u >> 12;
      heap[outIdx++ >>> 0] = 128 | u >> 6 & 63;
      heap[outIdx++ >>> 0] = 128 | u & 63;
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u > 1114111) warnOnce("Invalid Unicode code point " + ptrToString(u) + " encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).");
      heap[outIdx++ >>> 0] = 240 | u >> 18;
      heap[outIdx++ >>> 0] = 128 | u >> 12 & 63;
      heap[outIdx++ >>> 0] = 128 | u >> 6 & 63;
      heap[outIdx++ >>> 0] = 128 | u & 63;
    }
  }
  // Null-terminate the pointer to the buffer.
  heap[outIdx >>> 0] = 0;
  return outIdx - startIdx;
};
var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
  assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
};
var lengthBytesUTF8 = str => {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
    // unit, not a Unicode code point of the character! So decode
    // UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var c = str.charCodeAt(i);
    // possibly a lead surrogate
    if (c <= 127) {
      len++;
    } else if (c <= 2047) {
      len += 2;
    } else if (c >= 55296 && c <= 57343) {
      len += 4;
      ++i;
    } else {
      len += 3;
    }
  }
  return len;
};
function __embind_register_std_string(rawType, name) {
  rawType >>>= 0;
  name >>>= 0;
  name = readLatin1String(name);
  var stdStringIsUTF8 = true;
  registerType(rawType, {
    name,
    // For some method names we use string keys here since they are part of
    // the public/external API and/or used by the runtime-generated code.
    "fromWireType"(value) {
      var length = HEAPU32[value >>> 2 >>> 0];
      var payload = value + 4;
      var str;
      if (stdStringIsUTF8) {
        var decodeStartPtr = payload;
        // Looping here to support possible embedded '0' bytes
        for (var i = 0; i <= length; ++i) {
          var currentBytePtr = payload + i;
          if (i == length || HEAPU8[currentBytePtr >>> 0] == 0) {
            var maxRead = currentBytePtr - decodeStartPtr;
            var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
            if (str === undefined) {
              str = stringSegment;
            } else {
              str += String.fromCharCode(0);
              str += stringSegment;
            }
            decodeStartPtr = currentBytePtr + 1;
          }
        }
      } else {
        var a = new Array(length);
        for (var i = 0; i < length; ++i) {
          a[i] = String.fromCharCode(HEAPU8[payload + i >>> 0]);
        }
        str = a.join("");
      }
      _free(value);
      return str;
    },
    "toWireType"(destructors, value) {
      if (value instanceof ArrayBuffer) {
        value = new Uint8Array(value);
      }
      var length;
      var valueIsOfTypeString = typeof value == "string";
      // We accept `string` or array views with single byte elements
      if (!(valueIsOfTypeString || ArrayBuffer.isView(value) && value.BYTES_PER_ELEMENT == 1)) {
        throwBindingError("Cannot pass non-string to std::string");
      }
      if (stdStringIsUTF8 && valueIsOfTypeString) {
        length = lengthBytesUTF8(value);
      } else {
        length = value.length;
      }
      // assumes POINTER_SIZE alignment
      var base = _malloc(4 + length + 1);
      var ptr = base + 4;
      HEAPU32[base >>> 2 >>> 0] = length;
      if (valueIsOfTypeString) {
        if (stdStringIsUTF8) {
          stringToUTF8(value, ptr, length + 1);
        } else {
          for (var i = 0; i < length; ++i) {
            var charCode = value.charCodeAt(i);
            if (charCode > 255) {
              _free(base);
              throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
            }
            HEAPU8[ptr + i >>> 0] = charCode;
          }
        }
      } else {
        HEAPU8.set(value, ptr >>> 0);
      }
      if (destructors !== null) {
        destructors.push(_free, base);
      }
      return base;
    },
    argPackAdvance: GenericWireTypeSize,
    "readValueFromPointer": readPointer,
    destructorFunction(ptr) {
      _free(ptr);
    }
  });
}
var UTF16Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf-16le") : undefined;
var UTF16ToString = (ptr, maxBytesToRead) => {
  assert(ptr % 2 == 0, "Pointer passed to UTF16ToString must be aligned to two bytes!");
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on
  // null terminator by itself.
  // Also, use the length info to avoid running tiny strings through
  // TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  var maxIdx = idx + maxBytesToRead / 2;
  // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.
  while (!(idx >= maxIdx) && HEAPU16[idx >>> 0]) ++idx;
  endPtr = idx << 1;
  if (endPtr - ptr > 32 && UTF16Decoder) return UTF16Decoder.decode(HEAPU8.subarray(ptr >>> 0, endPtr >>> 0));
  // Fallback: decode without UTF16Decoder
  var str = "";
  // If maxBytesToRead is not passed explicitly, it will be undefined, and the
  // for-loop's condition will always evaluate to true. The loop is then
  // terminated on the first null char.
  for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
    var codeUnit = HEAP16[ptr + i * 2 >>> 1 >>> 0];
    if (codeUnit == 0) break;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can
    // pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
  return str;
};
var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
  assert(outPtr % 2 == 0, "Pointer passed to stringToUTF16 must be aligned to two bytes!");
  assert(typeof maxBytesToWrite == "number", "stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  maxBytesToWrite !== null && maxBytesToWrite !== void 0 ? maxBytesToWrite : maxBytesToWrite = 2147483647;
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2;
  // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i);
    // possibly a lead surrogate
    HEAP16[outPtr >>> 1 >>> 0] = codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[outPtr >>> 1 >>> 0] = 0;
  return outPtr - startPtr;
};
var lengthBytesUTF16 = str => str.length * 2;
var UTF32ToString = (ptr, maxBytesToRead) => {
  assert(ptr % 4 == 0, "Pointer passed to UTF32ToString must be aligned to four bytes!");
  var i = 0;
  var str = "";
  // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.
  while (!(i >= maxBytesToRead / 4)) {
    var utf32 = HEAP32[ptr + i * 4 >>> 2 >>> 0];
    if (utf32 == 0) break;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 65536) {
      var ch = utf32 - 65536;
      str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
    } else {
      str += String.fromCharCode(utf32);
    }
  }
  return str;
};
var stringToUTF32 = (str, outPtr, maxBytesToWrite) => {
  outPtr >>>= 0;
  assert(outPtr % 4 == 0, "Pointer passed to stringToUTF32 must be aligned to four bytes!");
  assert(typeof maxBytesToWrite == "number", "stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  maxBytesToWrite !== null && maxBytesToWrite !== void 0 ? maxBytesToWrite : maxBytesToWrite = 2147483647;
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    // possibly a lead surrogate
    if (codeUnit >= 55296 && codeUnit <= 57343) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
    }
    HEAP32[outPtr >>> 2 >>> 0] = codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[outPtr >>> 2 >>> 0] = 0;
  return outPtr - startPtr;
};
var lengthBytesUTF32 = str => {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
    // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }
  return len;
};
var __embind_register_std_wstring = function (rawType, charSize, name) {
  rawType >>>= 0;
  charSize >>>= 0;
  name >>>= 0;
  name = readLatin1String(name);
  var decodeString, encodeString, readCharAt, lengthBytesUTF;
  if (charSize === 2) {
    decodeString = UTF16ToString;
    encodeString = stringToUTF16;
    lengthBytesUTF = lengthBytesUTF16;
    readCharAt = pointer => HEAPU16[pointer >>> 1 >>> 0];
  } else if (charSize === 4) {
    decodeString = UTF32ToString;
    encodeString = stringToUTF32;
    lengthBytesUTF = lengthBytesUTF32;
    readCharAt = pointer => HEAPU32[pointer >>> 2 >>> 0];
  }
  registerType(rawType, {
    name,
    "fromWireType": value => {
      // Code mostly taken from _embind_register_std_string fromWireType
      var length = HEAPU32[value >>> 2 >>> 0];
      var str;
      var decodeStartPtr = value + 4;
      // Looping here to support possible embedded '0' bytes
      for (var i = 0; i <= length; ++i) {
        var currentBytePtr = value + 4 + i * charSize;
        if (i == length || readCharAt(currentBytePtr) == 0) {
          var maxReadBytes = currentBytePtr - decodeStartPtr;
          var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
          if (str === undefined) {
            str = stringSegment;
          } else {
            str += String.fromCharCode(0);
            str += stringSegment;
          }
          decodeStartPtr = currentBytePtr + charSize;
        }
      }
      _free(value);
      return str;
    },
    "toWireType": (destructors, value) => {
      if (!(typeof value == "string")) {
        throwBindingError("Cannot pass non-string to C++ string type ".concat(name));
      }
      // assumes POINTER_SIZE alignment
      var length = lengthBytesUTF(value);
      var ptr = _malloc(4 + length + charSize);
      HEAPU32[ptr >>> 2 >>> 0] = length / charSize;
      encodeString(value, ptr + 4, length + charSize);
      if (destructors !== null) {
        destructors.push(_free, ptr);
      }
      return ptr;
    },
    argPackAdvance: GenericWireTypeSize,
    "readValueFromPointer": readPointer,
    destructorFunction(ptr) {
      _free(ptr);
    }
  });
};
var __embind_register_void = function (rawType, name) {
  rawType >>>= 0;
  name >>>= 0;
  name = readLatin1String(name);
  registerType(rawType, {
    isVoid: true,
    // void return values can be optimized out sometimes
    name,
    argPackAdvance: 0,
    "fromWireType": () => undefined,
    // TODO: assert if anything else is given?
    "toWireType": (destructors, o) => undefined
  });
};
var requireRegisteredType = (rawType, humanName) => {
  var impl = registeredTypes[rawType];
  if (undefined === impl) {
    throwBindingError("".concat(humanName, " has unknown type ").concat(getTypeName(rawType)));
  }
  return impl;
};
var emval_returnValue = (returnType, destructorsRef, handle) => {
  var destructors = [];
  var result = returnType["toWireType"](destructors, handle);
  if (destructors.length) {
    // void, primitives and any other types w/o destructors don't need to allocate a handle
    HEAPU32[destructorsRef >>> 2 >>> 0] = Emval.toHandle(destructors);
  }
  return result;
};
function __emval_as(handle, returnType, destructorsRef) {
  handle >>>= 0;
  returnType >>>= 0;
  destructorsRef >>>= 0;
  handle = Emval.toValue(handle);
  returnType = requireRegisteredType(returnType, "emval::as");
  return emval_returnValue(returnType, destructorsRef, handle);
}
function __emval_get_property(handle, key) {
  handle >>>= 0;
  key >>>= 0;
  handle = Emval.toValue(handle);
  key = Emval.toValue(key);
  return Emval.toHandle(handle[key]);
}
var emval_symbols = {};
var getStringOrSymbol = address => {
  var symbol = emval_symbols[address];
  if (symbol === undefined) {
    return readLatin1String(address);
  }
  return symbol;
};
function __emval_new_cstring(v) {
  v >>>= 0;
  return Emval.toHandle(getStringOrSymbol(v));
}
function __emval_run_destructors(handle) {
  handle >>>= 0;
  var destructors = Emval.toValue(handle);
  runDestructors(destructors);
  __emval_decref(handle);
}
function __emval_take_value(type, arg) {
  type >>>= 0;
  arg >>>= 0;
  type = requireRegisteredType(type, "_emval_take_value");
  var v = type["readValueFromPointer"](arg);
  return Emval.toHandle(v);
}
var __tzset_js = function (timezone, daylight, std_name, dst_name) {
  timezone >>>= 0;
  daylight >>>= 0;
  std_name >>>= 0;
  dst_name >>>= 0;
  // TODO: Use (malleable) environment variables instead of system settings.
  var currentYear = new Date().getFullYear();
  var winter = new Date(currentYear, 0, 1);
  var summer = new Date(currentYear, 6, 1);
  var winterOffset = winter.getTimezoneOffset();
  var summerOffset = summer.getTimezoneOffset();
  // Local standard timezone offset. Local standard time is not adjusted for
  // daylight savings.  This code uses the fact that getTimezoneOffset returns
  // a greater value during Standard Time versus Daylight Saving Time (DST).
  // Thus it determines the expected output during Standard Time, and it
  // compares whether the output of the given date the same (Standard) or less
  // (DST).
  var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  // timezone is specified as seconds west of UTC ("The external variable
  // `timezone` shall be set to the difference, in seconds, between
  // Coordinated Universal Time (UTC) and local standard time."), the same
  // as returned by stdTimezoneOffset.
  // See http://pubs.opengroup.org/onlinepubs/009695399/functions/tzset.html
  HEAPU32[timezone >>> 2 >>> 0] = stdTimezoneOffset * 60;
  HEAP32[daylight >>> 2 >>> 0] = Number(winterOffset != summerOffset);
  var extractZone = timezoneOffset => {
    // Why inverse sign?
    // Read here https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
    var sign = timezoneOffset >= 0 ? "-" : "+";
    var absOffset = Math.abs(timezoneOffset);
    var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
    var minutes = String(absOffset % 60).padStart(2, "0");
    return "UTC".concat(sign).concat(hours).concat(minutes);
  };
  var winterName = extractZone(winterOffset);
  var summerName = extractZone(summerOffset);
  assert(winterName);
  assert(summerName);
  assert(lengthBytesUTF8(winterName) <= 16, "timezone name truncated to fit in TZNAME_MAX (".concat(winterName, ")"));
  assert(lengthBytesUTF8(summerName) <= 16, "timezone name truncated to fit in TZNAME_MAX (".concat(summerName, ")"));
  if (summerOffset < winterOffset) {
    // Northern hemisphere
    stringToUTF8(winterName, std_name, 17);
    stringToUTF8(summerName, dst_name, 17);
  } else {
    stringToUTF8(winterName, dst_name, 17);
    stringToUTF8(summerName, std_name, 17);
  }
};
var _emscripten_date_now = () => Date.now();
var getHeapMax = () =>
// Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
// full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
// for any code that deals with heap sizes, which would require special
// casing all heap size related code to treat 0 specially.
4294901760;
var alignMemory = (size, alignment) => {
  assert(alignment, "alignment argument is required");
  return Math.ceil(size / alignment) * alignment;
};
var growMemory = size => {
  var b = wasmMemory.buffer;
  var pages = (size - b.byteLength + 65535) / 65536 | 0;
  try {
    // round size grow request up to wasm page size (fixed 64KB per spec)
    wasmMemory.grow(pages);
    // .grow() takes a delta compared to the previous size
    updateMemoryViews();
    return 1;
  } catch (e) {
    err("growMemory: Attempted to grow heap from ".concat(b.byteLength, " bytes to ").concat(size, " bytes, but got error: ").concat(e));
  }
};
function _emscripten_resize_heap(requestedSize) {
  requestedSize >>>= 0;
  var oldSize = HEAPU8.length;
  // With multithreaded builds, races can happen (another thread might increase the size
  // in between), so return a failure, and let the caller retry.
  assert(requestedSize > oldSize);
  // Memory resize rules:
  // 1.  Always increase heap size to at least the requested size, rounded up
  //     to next page multiple.
  // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
  //     geometrically: increase the heap size according to
  //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
  //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
  // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
  //     linearly: increase the heap size by at least
  //     MEMORY_GROWTH_LINEAR_STEP bytes.
  // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
  //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
  // 4.  If we were unable to allocate as much memory, it may be due to
  //     over-eager decision to excessively reserve due to (3) above.
  //     Hence if an allocation fails, cut down on the amount of excess
  //     growth, in an attempt to succeed to perform a smaller allocation.
  // A limit is set for how much we can grow. We should not exceed that
  // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
  var maxHeapSize = getHeapMax();
  if (requestedSize > maxHeapSize) {
    err("Cannot enlarge memory, requested ".concat(requestedSize, " bytes, but the limit is ").concat(maxHeapSize, " bytes!"));
    return false;
  }
  // Loop through potential heap size increases. If we attempt a too eager
  // reservation that fails, cut down on the attempted size and reserve a
  // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
  for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
    var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
    // ensure geometric growth
    // but limit overreserving (default to capping at +96MB overgrowth at most)
    overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
    var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
    var replacement = growMemory(newSize);
    if (replacement) {
      return true;
    }
  }
  err("Failed to grow the heap from ".concat(oldSize, " bytes to ").concat(newSize, " bytes, not enough memory!"));
  return false;
}
var ENV = {};
var getExecutableName = () => thisProgram || "./this.program";
var getEnvStrings = () => {
  if (!getEnvStrings.strings) {
    // Default values.
    // Browser language detection #8751
    var lang = (typeof navigator == "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
    var env = {
      "USER": "web_user",
      "LOGNAME": "web_user",
      "PATH": "/",
      "PWD": "/",
      "HOME": "/home/web_user",
      "LANG": lang,
      "_": getExecutableName()
    };
    // Apply the user-provided values, if any.
    for (var x in ENV) {
      // x is a key in ENV; if ENV[x] is undefined, that means it was
      // explicitly set to be so. We allow user code to do that to
      // force variables with default values to remain unset.
      if (ENV[x] === undefined) delete env[x];else env[x] = ENV[x];
    }
    var strings = [];
    for (var x in env) {
      strings.push("".concat(x, "=").concat(env[x]));
    }
    getEnvStrings.strings = strings;
  }
  return getEnvStrings.strings;
};
function _environ_get(__environ, environ_buf) {
  __environ >>>= 0;
  environ_buf >>>= 0;
  var bufSize = 0;
  var envp = 0;
  for (var string of getEnvStrings()) {
    var ptr = environ_buf + bufSize;
    HEAPU32[__environ + envp >>> 2 >>> 0] = ptr;
    bufSize += stringToUTF8(string, ptr, Infinity) + 1;
    envp += 4;
  }
  return 0;
}
function _environ_sizes_get(penviron_count, penviron_buf_size) {
  penviron_count >>>= 0;
  penviron_buf_size >>>= 0;
  var strings = getEnvStrings();
  HEAPU32[penviron_count >>> 2 >>> 0] = strings.length;
  var bufSize = 0;
  for (var string of strings) {
    bufSize += lengthBytesUTF8(string) + 1;
  }
  HEAPU32[penviron_buf_size >>> 2 >>> 0] = bufSize;
  return 0;
}
var SYSCALLS = {
  varargs: undefined,
  getStr(ptr) {
    var ret = UTF8ToString(ptr);
    return ret;
  }
};
var _fd_close = fd => {
  abort("fd_close called without SYSCALLS_REQUIRE_FILESYSTEM");
};
function _fd_read(fd, iov, iovcnt, pnum) {
  iov >>>= 0;
  iovcnt >>>= 0;
  pnum >>>= 0;
  abort("fd_read called without SYSCALLS_REQUIRE_FILESYSTEM");
}
function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
  var offset = convertI32PairToI53Checked(offset_low, offset_high);
  newOffset >>>= 0;
  return 70;
}
var printCharBuffers = [null, [], []];
var printChar = (stream, curr) => {
  var buffer = printCharBuffers[stream];
  assert(buffer);
  if (curr === 0 || curr === 10) {
    (stream === 1 ? out : err)(UTF8ArrayToString(buffer));
    buffer.length = 0;
  } else {
    buffer.push(curr);
  }
};
var flush_NO_FILESYSTEM = () => {
  // flush anything remaining in the buffers during shutdown
  _fflush(0);
  if (printCharBuffers[1].length) printChar(1, 10);
  if (printCharBuffers[2].length) printChar(2, 10);
};
function _fd_write(fd, iov, iovcnt, pnum) {
  iov >>>= 0;
  iovcnt >>>= 0;
  pnum >>>= 0;
  // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
  var num = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = HEAPU32[iov >>> 2 >>> 0];
    var len = HEAPU32[iov + 4 >>> 2 >>> 0];
    iov += 8;
    for (var j = 0; j < len; j++) {
      printChar(fd, HEAPU8[ptr + j >>> 0]);
    }
    num += len;
  }
  HEAPU32[pnum >>> 2 >>> 0] = num;
  return 0;
}
var wasmTableMirror = [];

/** @type {WebAssembly.Table} */
var wasmTable;
var getWasmTableEntry = funcPtr => {
  var func = wasmTableMirror[funcPtr];
  if (!func) {
    /** @suppress {checkTypes} */wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
  }
  /** @suppress {checkTypes} */
  assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
  return func;
};
var incrementExceptionRefcount = ptr => ___cxa_increment_exception_refcount(ptr);
var decrementExceptionRefcount = ptr => ___cxa_decrement_exception_refcount(ptr);
var stackAlloc = sz => __emscripten_stack_alloc(sz);
var getExceptionMessageCommon = ptr => {
  var sp = stackSave();
  var type_addr_addr = stackAlloc(4);
  var message_addr_addr = stackAlloc(4);
  ___get_exception_message(ptr, type_addr_addr, message_addr_addr);
  var type_addr = HEAPU32[type_addr_addr >>> 2 >>> 0];
  var message_addr = HEAPU32[message_addr_addr >>> 2 >>> 0];
  var type = UTF8ToString(type_addr);
  _free(type_addr);
  var message;
  if (message_addr) {
    message = UTF8ToString(message_addr);
    _free(message_addr);
  }
  stackRestore(sp);
  return [type, message];
};
var getExceptionMessage = ptr => getExceptionMessageCommon(ptr);
embind_init_charCodes();
init_ClassHandle();
init_RegisteredPointer();
init_emval();

// End JS library code
// include: postlibrary.js
// This file is included after the automatically-generated JS library code
// but before the wasm module is created.
{
  // Begin ATMODULES hooks
  if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
  if (Module["print"]) out = Module["print"];
  if (Module["printErr"]) err = Module["printErr"];
  if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
  Module["FS_createDataFile"] = FS.createDataFile;
  Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
  // End ATMODULES hooks
  checkIncomingModuleAPI();
  if (Module["arguments"]) arguments_ = Module["arguments"];
  if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
  // Assertions on removed incoming Module JS APIs.
  assert(typeof Module["memoryInitializerPrefixURL"] == "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["pthreadMainPrefixURL"] == "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["cdInitializerPrefixURL"] == "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["filePackagePrefixURL"] == "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");
  assert(typeof Module["read"] == "undefined", "Module.read option was removed");
  assert(typeof Module["readAsync"] == "undefined", "Module.readAsync option was removed (modify readAsync in JS)");
  assert(typeof Module["readBinary"] == "undefined", "Module.readBinary option was removed (modify readBinary in JS)");
  assert(typeof Module["setWindowTitle"] == "undefined", "Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)");
  assert(typeof Module["TOTAL_MEMORY"] == "undefined", "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");
  assert(typeof Module["ENVIRONMENT"] == "undefined", "Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)");
  assert(typeof Module["STACK_SIZE"] == "undefined", "STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time");
  // If memory is defined in wasm, the user can't provide it, or set INITIAL_MEMORY
  assert(typeof Module["wasmMemory"] == "undefined", "Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally");
  assert(typeof Module["INITIAL_MEMORY"] == "undefined", "Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically");
}

// Begin runtime exports
var missingLibrarySymbols = ["writeI53ToI64", "writeI53ToI64Clamped", "writeI53ToI64Signaling", "writeI53ToU64Clamped", "writeI53ToU64Signaling", "readI53FromI64", "readI53FromU64", "convertI32PairToI53", "convertU32PairToI53", "getTempRet0", "zeroMemory", "strError", "inetPton4", "inetNtop4", "inetPton6", "inetNtop6", "readSockaddr", "writeSockaddr", "emscriptenLog", "readEmAsmArgs", "jstoi_q", "listenOnce", "autoResumeAudioContext", "asmjsMangle", "asyncLoad", "mmapAlloc", "HandleAllocator", "getNativeTypeSize", "addOnInit", "addOnPostCtor", "addOnPreMain", "addOnExit", "STACK_SIZE", "STACK_ALIGN", "POINTER_SIZE", "ASSERTIONS", "getCFunc", "ccall", "cwrap", "uleb128Encode", "generateFuncType", "convertJsFunctionToWasm", "getEmptyTableSlot", "updateTableMap", "getFunctionAddress", "addFunction", "removeFunction", "reallyNegative", "unSign", "strLen", "reSign", "formatString", "intArrayFromString", "intArrayToString", "AsciiToString", "stringToAscii", "stringToNewUTF8", "stringToUTF8OnStack", "writeArrayToMemory", "registerKeyEventCallback", "maybeCStringToJsString", "findEventTarget", "getBoundingClientRect", "fillMouseEventData", "registerMouseEventCallback", "registerWheelEventCallback", "registerUiEventCallback", "registerFocusEventCallback", "fillDeviceOrientationEventData", "registerDeviceOrientationEventCallback", "fillDeviceMotionEventData", "registerDeviceMotionEventCallback", "screenOrientation", "fillOrientationChangeEventData", "registerOrientationChangeEventCallback", "fillFullscreenChangeEventData", "registerFullscreenChangeEventCallback", "JSEvents_requestFullscreen", "JSEvents_resizeCanvasForFullscreen", "registerRestoreOldStyle", "hideEverythingExceptGivenElement", "restoreHiddenElements", "setLetterbox", "softFullscreenResizeWebGLRenderTarget", "doRequestFullscreen", "fillPointerlockChangeEventData", "registerPointerlockChangeEventCallback", "registerPointerlockErrorEventCallback", "requestPointerLock", "fillVisibilityChangeEventData", "registerVisibilityChangeEventCallback", "registerTouchEventCallback", "fillGamepadEventData", "registerGamepadEventCallback", "registerBeforeUnloadEventCallback", "fillBatteryEventData", "battery", "registerBatteryEventCallback", "setCanvasElementSize", "getCanvasElementSize", "jsStackTrace", "getCallstack", "convertPCtoSourceLocation", "checkWasiClock", "wasiRightsToMuslOFlags", "wasiOFlagsToMuslOFlags", "initRandomFill", "randomFill", "safeSetTimeout", "setImmediateWrapped", "safeRequestAnimationFrame", "clearImmediateWrapped", "registerPostMainLoop", "registerPreMainLoop", "getPromise", "makePromise", "idsToPromises", "makePromiseCallback", "Browser_asyncPrepareDataCounter", "isLeapYear", "ydayFromDate", "arraySum", "addDays", "getSocketFromFD", "getSocketAddress", "heapObjectForWebGLType", "toTypedArrayIndex", "webgl_enable_ANGLE_instanced_arrays", "webgl_enable_OES_vertex_array_object", "webgl_enable_WEBGL_draw_buffers", "webgl_enable_WEBGL_multi_draw", "webgl_enable_EXT_polygon_offset_clamp", "webgl_enable_EXT_clip_control", "webgl_enable_WEBGL_polygon_mode", "emscriptenWebGLGet", "computeUnpackAlignedImageSize", "colorChannelsInGlTextureFormat", "emscriptenWebGLGetTexPixelData", "emscriptenWebGLGetUniform", "webglGetUniformLocation", "webglPrepareUniformLocationsBeforeFirstUse", "webglGetLeftBracePos", "emscriptenWebGLGetVertexAttrib", "__glGetActiveAttribOrUniform", "writeGLArray", "registerWebGlEventCallback", "ALLOC_NORMAL", "ALLOC_STACK", "allocate", "writeStringToMemory", "writeAsciiToMemory", "demangle", "stackTrace", "getFunctionArgsName", "createJsInvokerSignature", "PureVirtualError", "registerInheritedInstance", "unregisterInheritedInstance", "getInheritedInstanceCount", "getLiveInheritedInstances", "enumReadValueFromPointer", "setDelayFunction", "validateThis", "emval_get_global", "emval_lookupTypes", "emval_addMethodCaller"];
missingLibrarySymbols.forEach(missingLibrarySymbol);
var unexportedSymbols = ["run", "addRunDependency", "removeRunDependency", "out", "err", "callMain", "abort", "wasmMemory", "wasmExports", "HEAPF32", "HEAPF64", "HEAP8", "HEAPU8", "HEAP16", "HEAPU16", "HEAP32", "HEAPU32", "HEAP64", "HEAPU64", "writeStackCookie", "checkStackCookie", "convertI32PairToI53Checked", "stackSave", "stackRestore", "stackAlloc", "setTempRet0", "ptrToString", "exitJS", "getHeapMax", "growMemory", "ENV", "ERRNO_CODES", "DNS", "Protocols", "Sockets", "timers", "warnOnce", "readEmAsmArgsArray", "jstoi_s", "getExecutableName", "dynCallLegacy", "getDynCaller", "dynCall", "handleException", "keepRuntimeAlive", "runtimeKeepalivePush", "runtimeKeepalivePop", "callUserCallback", "maybeExit", "alignMemory", "wasmTable", "noExitRuntime", "addOnPreRun", "addOnPostRun", "sigToWasmTypes", "freeTableIndexes", "functionsInTableMap", "setValue", "getValue", "PATH", "PATH_FS", "UTF8Decoder", "UTF8ArrayToString", "UTF8ToString", "stringToUTF8Array", "stringToUTF8", "lengthBytesUTF8", "UTF16Decoder", "UTF16ToString", "stringToUTF16", "lengthBytesUTF16", "UTF32ToString", "stringToUTF32", "lengthBytesUTF32", "JSEvents", "specialHTMLTargets", "findCanvasEventTarget", "currentFullscreenStrategy", "restoreOldWindowedStyle", "UNWIND_CACHE", "ExitStatus", "getEnvStrings", "flush_NO_FILESYSTEM", "emSetImmediate", "emClearImmediate_deps", "emClearImmediate", "promiseMap", "uncaughtExceptionCount", "exceptionLast", "exceptionCaught", "ExceptionInfo", "findMatchingCatch", "getExceptionMessageCommon", "Browser", "getPreloadedImageData__data", "wget", "MONTH_DAYS_REGULAR", "MONTH_DAYS_LEAP", "MONTH_DAYS_REGULAR_CUMULATIVE", "MONTH_DAYS_LEAP_CUMULATIVE", "SYSCALLS", "tempFixedLengthArray", "miniTempWebGLFloatBuffers", "miniTempWebGLIntBuffers", "GL", "AL", "GLUT", "EGL", "GLEW", "IDBStore", "runAndAbortIfError", "Asyncify", "Fibers", "SDL", "SDL_gfx", "allocateUTF8", "allocateUTF8OnStack", "print", "printErr", "InternalError", "BindingError", "throwInternalError", "throwBindingError", "registeredTypes", "awaitingDependencies", "typeDependencies", "tupleRegistrations", "structRegistrations", "sharedRegisterType", "whenDependentTypesAreResolved", "embind_charCodes", "embind_init_charCodes", "readLatin1String", "getTypeName", "getFunctionName", "heap32VectorToArray", "requireRegisteredType", "usesDestructorStack", "checkArgCount", "getRequiredArgCount", "createJsInvoker", "UnboundTypeError", "GenericWireTypeSize", "EmValType", "EmValOptionalType", "throwUnboundTypeError", "ensureOverloadTable", "exposePublicSymbol", "replacePublicSymbol", "createNamedFunction", "embindRepr", "registeredInstances", "getBasestPointer", "getInheritedInstance", "registeredPointers", "registerType", "integerReadValueFromPointer", "floatReadValueFromPointer", "readPointer", "runDestructors", "craftInvokerFunction", "embind__requireFunction", "genericPointerToWireType", "constNoSmartPtrRawPointerToWireType", "nonConstNoSmartPtrRawPointerToWireType", "init_RegisteredPointer", "RegisteredPointer", "RegisteredPointer_fromWireType", "runDestructor", "releaseClassHandle", "finalizationRegistry", "detachFinalizer_deps", "detachFinalizer", "attachFinalizer", "makeClassHandle", "init_ClassHandle", "ClassHandle", "throwInstanceAlreadyDeleted", "deletionQueue", "flushPendingDeletes", "delayFunction", "RegisteredClass", "shallowCopyInternalPointer", "downcastPointer", "upcastPointer", "char_0", "char_9", "makeLegalFunctionName", "emval_freelist", "emval_handles", "emval_symbols", "init_emval", "count_emval_handles", "getStringOrSymbol", "Emval", "emval_returnValue", "emval_methodCallers", "reflectConstruct"];
unexportedSymbols.forEach(unexportedRuntimeSymbol);

// End runtime exports
// Begin JS library exports
Module["incrementExceptionRefcount"] = incrementExceptionRefcount;
Module["decrementExceptionRefcount"] = decrementExceptionRefcount;
Module["getExceptionMessage"] = getExceptionMessage;

// End JS library exports
// end include: postlibrary.js
function checkIncomingModuleAPI() {
  ignoredModuleProp("fetchSettings");
}
function __asyncjs__check_interrupt_async() {
  return Asyncify.handleAsync(async () => await Module.checkInterruptAsync());
}
function check_interrupt_sync() {
  return Module.checkInterrupt();
}
var wasmImports = {
  /** @export */__assert_fail: ___assert_fail,
  /** @export */__asyncjs__check_interrupt_async,
  /** @export */__cxa_begin_catch: ___cxa_begin_catch,
  /** @export */__cxa_end_catch: ___cxa_end_catch,
  /** @export */__cxa_find_matching_catch_2: ___cxa_find_matching_catch_2,
  /** @export */__cxa_find_matching_catch_3: ___cxa_find_matching_catch_3,
  /** @export */__cxa_rethrow: ___cxa_rethrow,
  /** @export */__cxa_throw: ___cxa_throw,
  /** @export */__cxa_uncaught_exceptions: ___cxa_uncaught_exceptions,
  /** @export */__resumeException: ___resumeException,
  /** @export */_abort_js: __abort_js,
  /** @export */_embind_register_bigint: __embind_register_bigint,
  /** @export */_embind_register_bool: __embind_register_bool,
  /** @export */_embind_register_class: __embind_register_class,
  /** @export */_embind_register_class_constructor: __embind_register_class_constructor,
  /** @export */_embind_register_class_function: __embind_register_class_function,
  /** @export */_embind_register_emval: __embind_register_emval,
  /** @export */_embind_register_float: __embind_register_float,
  /** @export */_embind_register_function: __embind_register_function,
  /** @export */_embind_register_integer: __embind_register_integer,
  /** @export */_embind_register_memory_view: __embind_register_memory_view,
  /** @export */_embind_register_optional: __embind_register_optional,
  /** @export */_embind_register_std_string: __embind_register_std_string,
  /** @export */_embind_register_std_wstring: __embind_register_std_wstring,
  /** @export */_embind_register_void: __embind_register_void,
  /** @export */_emval_as: __emval_as,
  /** @export */_emval_decref: __emval_decref,
  /** @export */_emval_get_property: __emval_get_property,
  /** @export */_emval_new_cstring: __emval_new_cstring,
  /** @export */_emval_run_destructors: __emval_run_destructors,
  /** @export */_emval_take_value: __emval_take_value,
  /** @export */_tzset_js: __tzset_js,
  /** @export */check_interrupt_sync,
  /** @export */emscripten_date_now: _emscripten_date_now,
  /** @export */emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */environ_get: _environ_get,
  /** @export */environ_sizes_get: _environ_sizes_get,
  /** @export */fd_close: _fd_close,
  /** @export */fd_read: _fd_read,
  /** @export */fd_seek: _fd_seek,
  /** @export */fd_write: _fd_write,
  /** @export */invoke_d,
  /** @export */invoke_dd,
  /** @export */invoke_di,
  /** @export */invoke_diii,
  /** @export */invoke_fiii,
  /** @export */invoke_i,
  /** @export */invoke_id,
  /** @export */invoke_ii,
  /** @export */invoke_iid,
  /** @export */invoke_iidi,
  /** @export */invoke_iii,
  /** @export */invoke_iiiddd,
  /** @export */invoke_iiii,
  /** @export */invoke_iiiii,
  /** @export */invoke_iiiiid,
  /** @export */invoke_iiiiii,
  /** @export */invoke_iiiiiii,
  /** @export */invoke_iiiiiiii,
  /** @export */invoke_iiiiiiiiiii,
  /** @export */invoke_iiiiiiiiiiii,
  /** @export */invoke_iiiiiiiiiiiii,
  /** @export */invoke_jiiii,
  /** @export */invoke_v,
  /** @export */invoke_vi,
  /** @export */invoke_vii,
  /** @export */invoke_viidd,
  /** @export */invoke_viiddi,
  /** @export */invoke_viiddii,
  /** @export */invoke_viii,
  /** @export */invoke_viiii,
  /** @export */invoke_viiiidi,
  /** @export */invoke_viiiii,
  /** @export */invoke_viiiiid,
  /** @export */invoke_viiiiiii,
  /** @export */invoke_viiiiiiiiii,
  /** @export */invoke_viiiiiiiiiiiiiii
};
var wasmExports = await createWasm();
var ___wasm_call_ctors = createExportWrapper("__wasm_call_ctors", 0);
var ___getTypeName = createExportWrapper("__getTypeName", 1);
var ___cxa_free_exception = createExportWrapper("__cxa_free_exception", 1);
var _free = createExportWrapper("free", 1);
var _malloc = createExportWrapper("malloc", 1);
var _fflush = createExportWrapper("fflush", 1);
var _emscripten_stack_get_end = wasmExports["emscripten_stack_get_end"];
var _emscripten_stack_get_base = wasmExports["emscripten_stack_get_base"];
var _setThrew = createExportWrapper("setThrew", 2);
var __emscripten_tempret_set = createExportWrapper("_emscripten_tempret_set", 1);
var _emscripten_stack_init = wasmExports["emscripten_stack_init"];
var _emscripten_stack_get_free = wasmExports["emscripten_stack_get_free"];
var __emscripten_stack_restore = wasmExports["_emscripten_stack_restore"];
var __emscripten_stack_alloc = wasmExports["_emscripten_stack_alloc"];
var _emscripten_stack_get_current = wasmExports["emscripten_stack_get_current"];
var ___cxa_decrement_exception_refcount = createExportWrapper("__cxa_decrement_exception_refcount", 1);
var ___cxa_increment_exception_refcount = createExportWrapper("__cxa_increment_exception_refcount", 1);
var ___get_exception_message = createExportWrapper("__get_exception_message", 3);
var ___cxa_can_catch = createExportWrapper("__cxa_can_catch", 3);
var ___cxa_get_exception_ptr = createExportWrapper("__cxa_get_exception_ptr", 1);
var dynCall_v = Module["dynCall_v"] = createExportWrapper("dynCall_v", 1);
var dynCall_vii = Module["dynCall_vii"] = createExportWrapper("dynCall_vii", 3);
var dynCall_viii = Module["dynCall_viii"] = createExportWrapper("dynCall_viii", 4);
var dynCall_di = Module["dynCall_di"] = createExportWrapper("dynCall_di", 2);
var dynCall_iiii = Module["dynCall_iiii"] = createExportWrapper("dynCall_iiii", 4);
var dynCall_iii = Module["dynCall_iii"] = createExportWrapper("dynCall_iii", 3);
var dynCall_vi = Module["dynCall_vi"] = createExportWrapper("dynCall_vi", 2);
var dynCall_dd = Module["dynCall_dd"] = createExportWrapper("dynCall_dd", 2);
var dynCall_viiiiid = Module["dynCall_viiiiid"] = createExportWrapper("dynCall_viiiiid", 7);
var dynCall_viiii = Module["dynCall_viiii"] = createExportWrapper("dynCall_viiii", 5);
var dynCall_ii = Module["dynCall_ii"] = createExportWrapper("dynCall_ii", 2);
var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = createExportWrapper("dynCall_iiiiiii", 7);
var dynCall_id = Module["dynCall_id"] = createExportWrapper("dynCall_id", 2);
var dynCall_iiiii = Module["dynCall_iiiii"] = createExportWrapper("dynCall_iiiii", 5);
var dynCall_i = Module["dynCall_i"] = createExportWrapper("dynCall_i", 1);
var dynCall_iiiddd = Module["dynCall_iiiddd"] = createExportWrapper("dynCall_iiiddd", 6);
var dynCall_viiddii = Module["dynCall_viiddii"] = createExportWrapper("dynCall_viiddii", 7);
var dynCall_viidd = Module["dynCall_viidd"] = createExportWrapper("dynCall_viidd", 5);
var dynCall_viiddi = Module["dynCall_viiddi"] = createExportWrapper("dynCall_viiddi", 6);
var dynCall_iid = Module["dynCall_iid"] = createExportWrapper("dynCall_iid", 3);
var dynCall_viiiii = Module["dynCall_viiiii"] = createExportWrapper("dynCall_viiiii", 6);
var dynCall_iiiiii = Module["dynCall_iiiiii"] = createExportWrapper("dynCall_iiiiii", 6);
var dynCall_diii = Module["dynCall_diii"] = createExportWrapper("dynCall_diii", 4);
var dynCall_diiii = Module["dynCall_diiii"] = createExportWrapper("dynCall_diiii", 5);
var dynCall_viiiiii = Module["dynCall_viiiiii"] = createExportWrapper("dynCall_viiiiii", 7);
var dynCall_d = Module["dynCall_d"] = createExportWrapper("dynCall_d", 1);
var dynCall_iidi = Module["dynCall_iidi"] = createExportWrapper("dynCall_iidi", 4);
var dynCall_viiiidi = Module["dynCall_viiiidi"] = createExportWrapper("dynCall_viiiidi", 7);
var dynCall_iidiiii = Module["dynCall_iidiiii"] = createExportWrapper("dynCall_iidiiii", 7);
var dynCall_jiji = Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji", 5);
var dynCall_iiiiid = Module["dynCall_iiiiid"] = createExportWrapper("dynCall_iiiiid", 6);
var dynCall_viijii = Module["dynCall_viijii"] = createExportWrapper("dynCall_viijii", 7);
var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = createExportWrapper("dynCall_iiiiiiii", 8);
var dynCall_iiiiiiiiiii = Module["dynCall_iiiiiiiiiii"] = createExportWrapper("dynCall_iiiiiiiiiii", 11);
var dynCall_jiiii = Module["dynCall_jiiii"] = createExportWrapper("dynCall_jiiii", 5);
var dynCall_iiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiii"] = createExportWrapper("dynCall_iiiiiiiiiiiii", 13);
var dynCall_fiii = Module["dynCall_fiii"] = createExportWrapper("dynCall_fiii", 4);
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = createExportWrapper("dynCall_viiiiiii", 8);
var dynCall_iiiiiiiiiiii = Module["dynCall_iiiiiiiiiiii"] = createExportWrapper("dynCall_iiiiiiiiiiii", 12);
var dynCall_viiiiiiiiii = Module["dynCall_viiiiiiiiii"] = createExportWrapper("dynCall_viiiiiiiiii", 11);
var dynCall_viiiiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiiiii"] = createExportWrapper("dynCall_viiiiiiiiiiiiiii", 16);
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = createExportWrapper("dynCall_iiiiiiiii", 9);
var dynCall_iiiiij = Module["dynCall_iiiiij"] = createExportWrapper("dynCall_iiiiij", 7);
var dynCall_iiiiijj = Module["dynCall_iiiiijj"] = createExportWrapper("dynCall_iiiiijj", 9);
var dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = createExportWrapper("dynCall_iiiiiijj", 10);
var _asyncify_start_unwind = createExportWrapper("asyncify_start_unwind", 1);
var _asyncify_stop_unwind = createExportWrapper("asyncify_stop_unwind", 0);
var _asyncify_start_rewind = createExportWrapper("asyncify_start_rewind", 1);
var _asyncify_stop_rewind = createExportWrapper("asyncify_stop_rewind", 0);
function invoke_vii(index, a1, a2) {
  var sp = stackSave();
  try {
    dynCall_vii(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_viii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    dynCall_viii(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_di(index, a1) {
  var sp = stackSave();
  try {
    return dynCall_di(index, a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_iiii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_iiii(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_iii(index, a1, a2) {
  var sp = stackSave();
  try {
    return dynCall_iii(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_vi(index, a1) {
  var sp = stackSave();
  try {
    dynCall_vi(index, a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_dd(index, a1) {
  var sp = stackSave();
  try {
    return dynCall_dd(index, a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_viiiiid(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiiiid(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_ii(index, a1) {
  var sp = stackSave();
  try {
    return dynCall_ii(index, a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_viiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    dynCall_viiii(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_id(index, a1) {
  var sp = stackSave();
  try {
    return dynCall_id(index, a1);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_iiiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_iiiii(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiii(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_v(index) {
  var sp = stackSave();
  try {
    dynCall_v(index);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_viidd(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    dynCall_viidd(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_iiiddd(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_iiiddd(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_viiddii(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiddii(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_viiddi(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viiddi(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_iid(index, a1, a2) {
  var sp = stackSave();
  try {
    return dynCall_iid(index, a1, a2);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_i(index) {
  var sp = stackSave();
  try {
    return dynCall_i(index);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_iiiiii(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_viiiii(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    dynCall_viiiii(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_d(index) {
  var sp = stackSave();
  try {
    return dynCall_d(index);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_iidi(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_iidi(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_viiiidi(index, a1, a2, a3, a4, a5, a6) {
  var sp = stackSave();
  try {
    dynCall_viiiidi(index, a1, a2, a3, a4, a5, a6);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_iiiiid(index, a1, a2, a3, a4, a5) {
  var sp = stackSave();
  try {
    return dynCall_iiiiid(index, a1, a2, a3, a4, a5);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_iiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_iiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_fiii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_fiii(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_diii(index, a1, a2, a3) {
  var sp = stackSave();
  try {
    return dynCall_diii(index, a1, a2, a3);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  var sp = stackSave();
  try {
    dynCall_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}
function invoke_jiiii(index, a1, a2, a3, a4) {
  var sp = stackSave();
  try {
    return dynCall_jiiii(index, a1, a2, a3, a4);
  } catch (e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

// Argument name here must shadow the `wasmExports` global so
// that it is recognised by metadce and minify-import-export-names
// passes.
function applySignatureConversions(wasmExports) {
  // First, make a copy of the incoming exports object
  wasmExports = Object.assign({}, wasmExports);
  var makeWrapper_pp = f => a0 => f(a0) >>> 0;
  var makeWrapper_p = f => () => f() >>> 0;
  wasmExports["__getTypeName"] = makeWrapper_pp(wasmExports["__getTypeName"]);
  wasmExports["malloc"] = makeWrapper_pp(wasmExports["malloc"]);
  wasmExports["emscripten_stack_get_end"] = makeWrapper_p(wasmExports["emscripten_stack_get_end"]);
  wasmExports["emscripten_stack_get_base"] = makeWrapper_p(wasmExports["emscripten_stack_get_base"]);
  wasmExports["_emscripten_stack_alloc"] = makeWrapper_pp(wasmExports["_emscripten_stack_alloc"]);
  wasmExports["emscripten_stack_get_current"] = makeWrapper_p(wasmExports["emscripten_stack_get_current"]);
  wasmExports["__cxa_get_exception_ptr"] = makeWrapper_pp(wasmExports["__cxa_get_exception_ptr"]);
  return wasmExports;
}

// include: postamble.js
// === Auto-generated postamble setup entry stuff ===
var calledRun;
function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}
function run() {
  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }
  stackCheckInit();
  preRun();
  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }
  function doRun() {
    var _Module$onRuntimeInit;
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    assert(!calledRun);
    calledRun = true;
    Module["calledRun"] = true;
    if (ABORT) return;
    initRuntime();
    readyPromiseResolve(Module);
    (_Module$onRuntimeInit = Module["onRuntimeInitialized"]) === null || _Module$onRuntimeInit === void 0 || _Module$onRuntimeInit.call(Module);
    consumedModuleProp("onRuntimeInitialized");
    assert(!Module["_main"], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');
    postRun();
  }
  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout(() => {
      setTimeout(() => Module["setStatus"](""), 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
  checkStackCookie();
}
function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = x => {
    has = true;
  };
  try {
    // it doesn't matter if it fails
    flush_NO_FILESYSTEM();
  } catch (e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.");
    warnOnce("(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)");
  }
}
function preInit() {
  if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
      Module["preInit"].shift()();
    }
  }
  consumedModuleProp("preInit");
}
preInit();
run();

// end include: postamble.js
// include: postamble_modularize.js
// In MODULARIZE mode we wrap the generated code in a factory function
// and return either the Module itself, or a promise of the module.
// We assign to the `moduleRtn` global here and configure closure to see
// this as and extern so it won't get minified.
moduleRtn = readyPromise;

// Assertion for attempting to access module properties on the incoming
// moduleArg.  In the past we used this object as the prototype of the module
// and assigned properties to it, but now we return a distinct object.  This
// keeps the instance private until it is ready (i.e the promise has been
// resolved).
for (const prop of Object.keys(Module)) {
  if (!(prop in moduleArg)) {
    Object.defineProperty(moduleArg, prop, {
      configurable: true,
      get() {
        abort("Access to module property ('".concat(prop, "') is no longer possible via the module constructor argument; Instead, use the result of the module constructor."));
      }
    });
  }
}


  return moduleRtn;
}
);
})();
export default Module;
