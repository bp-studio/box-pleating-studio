
# Core

BP Studio Core is compiled as a web worker that handles a single project.
It's receives command from the [Client](../client/README.md) to mutate the state of the design,
process all dependent variables, and return the difference (`UpdateModel`) to the Client.

In order to simplify the protocol between the Client and the Core,
the Core will always assume that the command it receives is valid without checking.
Therefore it is the Client's responsibility to ensure the validity of the command.

In the future, Core might be rewritten as WebAssembly for better performance.

The data flow of the Core is depicted in the following chart.

```mermaid
flowchart TB
subgraph User input
	direction LR
	T([Tree structure])
	L([Edge lengths])
	F([Flap positions and sizes])
	P([Stretch pattern choices])
end
subgraph Tree
	h{{node heights}}
	b(tree balancing)
	d{{node distances}}
	a{{AABB hierarchy}}
end
j(junctions)
i[[invalid junctions]]
subgraph Stretch
	g(junction groups)
	c(configurations)
	p(patterns)
end
subgraph Contour
	rc(rough contours)
	pc{{pattern contours}}
	fc[[final contours]]
end

T --> h --> b
b & L --> d
d & F --> a --> rc --> fc
a --> j --> i & g
g --> c --> p
p & P --> pc --> fc
```
