
# Union algorithm

In this section,
we implemented a variation of the Martínez-Rueda-Feito algorithm,
described in their 2009 paper
[A New Algorithm for Computing Boolean Operations on Polygons](https://github.com/mfogel/polygon-clipping/blob/main/paper.pdf).

The implementation here is different from the original algorithm in a few ways:
1. It is specialized for dealing with polygons consists of axis-aligned edges and of integral coordinates only,
   not polygons in general.
2. It handles the union of all components at once, instead of making the union one by one.
   This is achieved by introducing the `wrapDelta` and `wrapCount` in the `SweepEvent`.
