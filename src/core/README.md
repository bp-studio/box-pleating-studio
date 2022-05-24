
# Core

BP Studio Core is compiled as a web worker that handles a single project.
It's receives command from the [Client](../client/README.md) to mutate the state of the design,
process all dependent variables, and return the difference to the Client.

In the future, Core might be rewritten as WebAssembly for better performance.
