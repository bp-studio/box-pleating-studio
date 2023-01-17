
# Client

BP Studio Client is in charge of the interactions inside the workspace area.
It creates a [Core](../core/README.md) worker for each opened project,
handles user interactions and render the graphics using [PIXI.js](https://pixijs.com/).

Notice that we do not install the entire `pixi.js` NPM package,
and instead we install individual packages that are actually used in this project.
This saves about 100KB in the final build size.
