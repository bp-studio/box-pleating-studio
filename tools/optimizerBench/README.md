# Optimizer benchmark

This tool runs the optimizer on a folder of `.bps` files and reports the timing
and the results of its integer stages (fitting and tidying), for comparing the
changes of the optimizer.

First build the debug version of the optimizer with `make`
(it builds `lib/optimizer/debug`), and then run:

```sh
pnpm bench:optimizer
```

Note that the debug build is about 25x slower than the optimized ones.
For timing, build an optimized Node.js build with

```sh
make MODE=opt "CXXFLAG_opt=-O3 -fno-exceptions -flto -D_OPENMP" "DEP_opt=lib/include/libnlopt.slsqp.2.11.0.a" "LDFLAG_opt=-lnlopt.slsqp.2.11.0 -sENVIRONMENT=node"
```

and change the import in `optimizer.bench.ts` to `lib/optimizer/opt/optimizer.js`.

## Options

The options are given by environment variables.

| Variable | Default | Meaning |
|---|---|---|
| `BPS_DIR` | `~/Documents/Origami/BP Studio Projects` | The folder of the `.bps` files to use. |
| `BPS_ONLY` | | Use only the files whose names contain this. |
| `BH` | | Set to `1` to enable basin-hopping. |
| `DIM` | | Set to `1` to keep the dimensions of the flaps (off by default, as saved designs are typically already fitted). |
| `TYPE` | | Set to `diag` to force diagonal sheets. |
