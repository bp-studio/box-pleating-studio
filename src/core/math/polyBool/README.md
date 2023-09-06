
# PolyBool algorithm

In this section,
we implemented a variation of the Martínez-Rueda-Feito algorithm,
described in their 2009 paper
[A New Algorithm for Computing Boolean Operations on Polygons](https://github.com/mfogel/polygon-clipping/blob/main/paper.pdf).

The implementation here is different from the original algorithm in a few ways:
1. It is optimized for dealing with polygons of very specific shapes,
   not polygons in general. Most notably, in both use cases here,
   there is no need to check for new intersection between newly adjacent segments after an `EndEvent`.
   (Such checking is needed in general because the segments could form a `>>` formation,
   but that cannot happen in the use cases here.)
2. It handles all components at once, instead of making the Boolean operation one by one.
   This is achieved by introducing the `wrapDelta` and `wrapCount` in the `SweepEvent`.

Also, comparing to some other existing implementations of the MRF algorithm
(such as [polybooljs](https://github.com/velipso/polybooljs), which was used previously by BP Studio),
the implementation here uses state-of-the-art data structures
(in particular RAVL tree) to provide much greater performance.

The algorithm is used in two places in BP Studio:
1. Find the union of some axis-aligned polygons. This is for generating the "rough contour" of rivers.
2. Find the intersection of two rounded rectangles. This is for displaying invalid overlappings of flaps.

## CP Generation and polygon intersection test

The algorithm for generating CP is also a type of sweep line algorithm
(though a bit different from the MRF algorithm), so as a bonus,
that part of the code is also included in this section (see `clip`).

We use a very similar algorithm to quickly test if two polygonal regions have any overlapping (see `overlap`).
