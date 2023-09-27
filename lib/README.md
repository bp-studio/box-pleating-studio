
# Lib

This folder used to contains some of the third-party libraries used by BP Studio.
Most of the libraries are now directly copied or built from `node_modules` folder to the `build` folder,
so what's in here are those libraries that need custom builds or fixes.
Those including:

- Bootstrap: Customized for BP Studio.
- JSZip: We wrap it into a web worker to improve performance.
- LZMA: The released file by LZMA.js contains minification error which makes it unusable, the file here fixed the error.
- Pixi: We manually split its bundle into two files to reduce TBT.