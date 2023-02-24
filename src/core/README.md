
# Core

BP Studio Core is compiled as a web worker that handles a single project.
It's receives command from the [Client](../client/README.md) to mutate the state of the design,
process all dependent variables, and return the difference (`UpdateModel`) to the Client.

In order to simplify the protocol between the Client and the Core,
the Core will always assume that the command it receives is valid without checking.
Therefore it is the Client's responsibility to ensure the validity of the command.

In the far future, the Core may be rewritten as WebAssembly for better performance,
but for foreseeable future this seems unnecessary as the runtime of the Client
exceeds that of the Core anyway.

The data flow of the Core is depicted in the following chart.

```mermaid
flowchart TB
subgraph User input
	direction LR
	T{{Tree\nstructure}}
	L{{Edge\nlengths}}
	F{{Flap positions\nand sizes}}
	P{{Stretch pattern\nchoices}}
end
subgraph Tree
	h([node heights])
	b(tree balancing)
	d([node distances])
	a([AABB hierarchy])
end
j(junctions)
i[[invalid\njunctions]]
subgraph Stretch pattern
	s(stretches)
	p([patterns])
end
subgraph Contour
	rc(rough contours)
	pc(pattern contours)
	fc[[final contours]]
end

T --> h --> b
b & L --> d
d & F --> a --> rc --> fc
a --> j --> i & s
s & P --> p --> pc --> fc
```
