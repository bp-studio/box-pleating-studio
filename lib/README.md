
# Lib

This folder used to contains some of the third-party libraries used by BP Studio.
Most of the libraries are now directly copied or built from `node_modules` folder to the `build` folder,
so there's not much left in here, except for:

- Bootstrap: Customized for BP Studio.
- JSZip: We wrap it into a web worker to improve performance.
- LZMA: The released file by LZMA.js contains minification error which makes it unusable, the file here fixed the error.
