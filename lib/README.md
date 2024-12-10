
# Lib

This folder used to contains some of the third-party libraries used by BP Studio.
Most of the libraries are now directly built from `node_modules` folder to the `build` folder,
so what's in here are those libraries that need custom builds or fixes.
Those including:

- Bootstrap: Customized [Bootstrap](https://getbootstrap.com/) theme for BP Studio.
- LZMA: The released file by [LZMA.js](https://github.com/LZMA-JS/LZMA-JS) contains minification error which makes it unusable, the file here fixed the error.
- NLopt: This contains the precompiled [NLopt](https://github.com/stevengj/nlopt) static library and header files.
  Note that this is a specially compiled version that runs only the SLSQP algorithm and nothing else.
  We have also modified nlopt.hpp to disable exception throwing.
- Optimizer: The compiled WASM files of the optimizer.
  There are two build variants:
  1. Debug build is for running in Node.js and for mocha unit tests
     (see [optimizer.spec.ts](../test/specs/optimizer.spec.ts)).
     It also enables DWARF debugging so setting breakpoints in C++ is possible.
	 (For VS Code, this requires the [WebAssembly DWARF Debugging](https://marketplace.visualstudio.com/items?itemName=ms-vscode.wasm-dwarf-debugging) extension.)
  2. Dist build is for the web worker and is thoroughly optimized (no debugging).
- Pixi: [Pixi](https://pixijs.com/) v7 has a deprecated dependency of `url`, and since v7 isn't designed to be side-effect-free,
  Rspack's tree-shaking doesn't work with it. We use a stub module as a substitute to reduce the bundle size.
  This can be removed after updating to Pixi v8.