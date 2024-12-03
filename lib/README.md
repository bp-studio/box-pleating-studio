
# Lib

This folder used to contains some of the third-party libraries used by BP Studio.
Most of the libraries are now directly built from `node_modules` folder to the `build` folder,
so what's in here are those libraries that need custom builds or fixes.
Those including:

- Bootstrap: Customized for BP Studio.
- LZMA: The released file by LZMA.js contains minification error which makes it unusable, the file here fixed the error.
- NLopt: This contains the precompiled NLopt static library and header files.
  Note that this is a specially compiled version that runs only the SLSQP algorithm and nothing else.
- Optimizer: The compiled WASM files of the optimizer.
  There are two build variants:
  1. Debug build is for running in Node.js and for mocha unit tests.
     It also enables DWARF debugging so setting breakpoints in C++ is possible.
  2. Dist build is for the web worker and is thoroughly optimized (no debugging).
- Pixi: Pixi v7 has a deprecated dependency of `url`, and since v7 isn't designed to be side-effect-free,
  Rspack's tree-shaking doesn't work with it. We use a stub module as a substitute to reduce the bundle size.
  This can be removed after updating to Pixi v8.