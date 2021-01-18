
# Box Pleating Studio

> Super-complex origami design made easy!

## Introduction

Box pleating is arguably the standard framework of modern super-complex origami designs, as the creases are much more predictable and manageable than those found in the traditional 22.5 degree system or circle packing. Although pure box pleating is well-known for not being very efficient in utilizing paper area, with the help of stretching gadgets (such as Kamiya patterns and the more generalized GOPS), it is now possible for box pleating to achieve efficiency nearly as good as the optimal circle packing. This app is created to help origami designers to blueprint their models in such systems.

## Prerequisites

Box Pleating Studio is not for origami beginners. In order to fully understand the pattern it creates and be able to fold it, you must be considerably familiar with the theory of uniaxial box pleating bases. You will find everything you need to know in Chapter 13 and 14 of Robert J. Lang's remarkable book (See [[1]](#b1) in the bibliography section below).

## How to get the app

Simply visit [https://bpstudio.abstreamace.com/](https://bpstudio.abstreamace.com/) to launch the BP Studio app, no downloading required! For the best performance, it is highly recommended that you use Chrome to visit the site. In any case, do update your browser to the latest version as BP Studio utilizes many new web features and will not work on legacy browsers.

If you visit the website by Chrome (on devices other than iPhone), Edge (on desktops), or Safari (on an iPhone), it will also inform you that you could install BP Studio to your device as a standalone app, and use it offline. Just follow the instructions to install it. This will provide the best user experience especially on mobile devices.

## The toolbar

Start from the upper-left, each button in the toolbar is explained as follows.

- File menu: Create new project, download or share projects, etc.
- Setting menu: Display options and app preferences (including language setting).
- Tools menu: Currently with one additional tool (TreeMaker format importing); more tools TBD.
- Help menu: About the app, version info, and how to support it.
- Tree structure: Edit the tree structure of your project.
- Layout: Edit the Flap and Gadget layout of your project.
- Option panel (only in mobile version): Opens the option panel. For desktop version the option panel is always in display on the right side.

Right click on the tab (or use the dropdown menu for touch devices) will expose actions related to tabs (such as cloning projects and close multiple tabs at once). Dragging the tabs to re-order them.

## How to use

As you create a new project, you will see a basic layout with two flaps (which is the minimal number of flaps allowed in the app in order to make structural sense). First you should go to the tree structure view and decide what the structure of your model should be. In order to edit the tree, click on any node and use commands in the option panel to modify the tree. You can add nodes, delete leaf nodes (you cannot delete non-leaves right away as this will break the tree), and modify the lengths of edges. You can also rearrange the position of the nodes on your sheet by dragging them around. It is also suggested that you name the the leaves to help identifying them with the flaps.

Once you have the desired structure, go to the layout view and start experimenting different combinations of flap locations. BP Studio will try its best to find stretching patterns for those flaps that has overlapping with their corresponding rectangles (but not with their corresponding circles), and try to determine the shape of all flaps and rivers automatically. For a very brief account of the method of generating stretch patterns used in this app, see [[2]](#b2).

When you finish your design, you can download you project, download the entire workspace, or export the design in SVG or PNG formats. You can right click (or long press for touch devices) on any download command in the file menu and click "save as" to choose the saving location and filename.

The coloring of hinges, ridges and axial-parallel creases follows Lang's convention in his book. For clarity, only the axial-parallel creases of the stretching patterns are shown, but you should have no problem figuring out the rest by looking at the ridge creases.

## Current limitations

 It is not always possible for BP Studio to find working stretch patterns in any valid layout. So far the author had implemented enough algorithms for finding patterns for any valid layout with two flaps, and for most valid layouts with three flaps. The author will continue to implement more algorithms for more complicated patterns in the future.

For the moment, BP Studio hasn't implemented the notion of elevation, half-integral unit structures, or meandering rivers. But you can widen or heighten your flaps by setting their width or height, and use them to create elevations in your final model. You can also use integral structures to roughly represent the space occupied by the half-integral structures, and transform them into the latter in your folding process. Meandering rivers might be represented similarly by using stub flaps, or you can just pretend that it's there and fold your thing anyway :)

Since generating a complete, flat-foldable mountain-valley CP would also require the notion of elevation as well as other considerations such as hinge direction choices, empty space filling etc., for the moment BP Studio also cannot automatically generate such CP for you, and you would have to complete those details using the theory of uniaxial box pleating bases. But the author do have plans to implement this feature in the future.

Other features such as undo/redo editing, diagonal/tilted grid, Oripa/Orihime format exporting etc. are also planned.

## Feedbacks are greatly appreciated!

If you notice any bugs, or have any suggestions, feel free to drop an issue here in GitHub. If you use BP Studio to create new designs, the author would love to see it, so please share you work to him by [Facebook](https://www.facebook.com/donald.mutsun.tsai/) or by [email](mailto:don.m.t.tsai@gmail.com).

## Bibliography

<span id="b1">[1]</span>: Robert J. Lang, *Origami Design Secrets: Mathematical Methods for an Ancient Art*, 2nd Ed., A K Peters/CRC Press, 2011.

<span id="b2">[2]</span>: Robert J. Lang and Mu-Tsun Tsai, *Generalized Offset Pythagorean Stretches in Box-Pleated Uniaxial Bases*, The Proceedings from the 7th International Meeting on Origami in Science, Mathematics, and Education, Vol.2, 2018, pp. 591-606.

## Acknowledgement

The author would like to specially thank the following people, in no particular ordering:
- Robert J. Lang for his work that inspired the idea of GOPS, and for his continuing support and encouragement throughout these years.
- Jürg Lehni and Jonathan Puckey, for creating [paper.js](http://paperjs.org/), the powerful and efficient vector graphics library that powers BP Studio.
- Lucas Tay Kiat Loong, for so eagerly volunteering to test BP Studio, helping catching many critical and subtle bugs, and providing many invaluable feedbacks.

## About the author

Mu-Tsun Tsai began his studying of origami design theory by reading Robert J. Lang's book. They soon became good friends and together they generalized the notion of Pythagorean Stretch into GOPS, and it was published in 7OSME. Tsai lives in Taiwan and makes a living by doing full-stack developing. He particularly specializes in C# and TypeScript. Tsai is also the author of the reactive framework Shrewd, which is the core powering Box Pleating Studio.

<hr>

## For contributors

BP Studio is developed using [VS Code](https://code.visualstudio.com/), and the project folder is already configured for it.

### Contributing new languages

If you would like to contribute a new language, start with `src/locale/en.json` and translate it. You will find the VS Code extension [i18n Ally](https://marketplace.visualstudio.com/items?itemName=antfu.i18n-ally) very helpful.

### Environment and build instructions

To build BP Studio, first you need the following:

1. Install [Node.js](https://nodejs.org/), and use the command `npm install` under the project root folder to install all dependencies.
2. Install [TypeScript](https://www.typescriptlang.org/) globally by the command `npm install --global typescript`.
2. Install [Gulp](https://www.npmjs.com/package/gulp) globally by the command `npm install --global gulp-cli`.

And then you can simply press `F5` in VS Code to build and launch the app automatically. Alternatively, run `gulp buildCore` to build the core part (`debug/bpstudio.js`, of which source code is under `src/core`) manually, and use any browser to open `dist/index.htm` to run it.

Other important gulp scripts include:

- `buildCorePub`: build the release version of `bpstudio.js` in `dist/`.
- `buildApp`: build the UI part (`main.js`, source code under `src/app`) of the app, which is written in [Vue.js](https://vuejs.org/) version 2.
- `buildLocale`: build `locale.js` (source code under `src/locale`).

### About BP Studio Core

BP Studio heavily depends on [Shrewd](https://github.com/MuTsunTsai/shrewd), a reactive JavaScript framework developed by the author, for managing the dependencies of thousands of variables. Shrewd makes sure that when some of the variables have changed by user interactions, only the necessary recalculation is performed, and in the correct order. It is recommended that you read about Shrewd in order to fully understand the source code of BP Studio.

All paths below are relative to `src/core`. Roughly speaking, a BP Studio project begins with a `Design` object (`core/Design.ts`), which contains a `Tree` object (`model/Tree.ts`) that describes the tree structure of our design. Then `Flap` objects (`components/Flap.ts`) are generated in correspondence to the leaf nodes in the tree, and `Junction` objects (`components/Junction.ts`), which monitors the overlapping status between two flaps, are generated for each pair of flaps. Junctions are then grouped into `Stretch` objects (`pattern/Stretch.ts`), and it will create a `Repository` object (`pattern/Repository.ts`) which is the starting point of searching for `Pattern` objects (`pattern/Pattern.ts`). After patterns are found, everything will then be rendered by the various `View` objects in the `view` folder, onto a canvas prepared by `core/Display.ts` using paper.js. User interactions are handled in `core/System.ts`.

Almost all comments in the source code are written in Chinese, which is slightly more intuitive for the author's train of thoughts; sorry about that 😅
