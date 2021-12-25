
# Contributing Guidelines

BP Studio is developed using [VS Code](https://code.visualstudio.com/),
and the project folder is already configured for it.

## Contributing new languages

If you would like to contribute a new language, start with `src/locale/en.json` and translate it.
You will find the VS Code extension [i18n Ally](https://marketplace.visualstudio.com/items?itemName=antfu.i18n-ally) very helpful.

## Environment and build instructions

To build BP Studio, first you need the following:

1. Install [Node.js](https://nodejs.org/), and use the command `npm install` under the project root folder to install all dependencies.
2. Install [TypeScript](https://www.typescriptlang.org/) globally by the command `npm install --global typescript`.
2. Install [Gulp](https://www.npmjs.com/package/gulp) globally by the command `npm install --global gulp-cli`.

And then you can simply press `F5` in VS Code to build and launch the app automatically.
Alternatively, run `gulp` (or `gulp default`) to build the entire project manually,
and use any browser to open `debug/index.htm` (or `dist/index.htm` if debug is not needed) to run it.

Typically the default task is sufficient for developing purpose,
and you won't need to execute individual subtask,
as all subtasks will skip themselves if the source files are not changed.
If something goes wrong, you can run `gulp clean` to cleanup built files and then rebuild everything.

## About BP Studio Core

BP Studio heavily depends on [Shrewd](https://github.com/MuTsunTsai/shrewd),
a reactive JavaScript framework developed by the author,
for managing the dependencies of thousands of variables.
Shrewd makes sure that when some of the variables have changed by user interactions,
only the necessary recalculation is performed, and in the correct order.
It is recommended that you read about Shrewd in order to fully understand the source code of BP Studio.

All paths below are relative to `src/core`.
Roughly speaking, a BP Studio project begins with a `Design` object (`design/Design.ts`),
which contains a `Tree` object (`content/tree/Tree.ts`) that describes the tree structure of our design.
Then `Flap` objects (`design/components/Flap.ts`) are generated in correspondence to the leaf nodes in the tree,
and `Junction` objects (`design/components/Junction.ts`), which monitors the overlapping status between two flaps,
are generated for each pair of flaps.
Junctions are then grouped into `Stretch` objects (`design/layout/Stretch.ts`),
and it will create a `Repository` object (`design/layout/Repository.ts`) which is the starting point of searching for `Pattern` objects (`design/layout/Pattern.ts`).
After patterns are found, everything will then be rendered by the various `View` objects in the `view` folder,
onto a canvas prepared by `env/screen/Display.ts` using paper.js.
User interactions are handled in `env/System.ts` and the controller classes (in `env/controllers`).

Almost all comments in the source code are written in Chinese,
which is slightly more intuitive for the author's train of thoughts; sorry about that 😅
