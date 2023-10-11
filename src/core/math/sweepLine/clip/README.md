# CP Generation and polygon intersection test

The algorithm for generating CP is also a type of sweep line algorithm
(though a bit different from the MRF algorithm), so as a bonus,
that part of the code is also included in this section (see `clip`).

We use a very similar algorithm to quickly test if two polygonal regions have any overlapping (see `overlap`).
