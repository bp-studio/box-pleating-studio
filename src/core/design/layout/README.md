
# Layout

This section handles the searching for stretch pattern and the calculation of contours.

## Stretch pattern searching

The algorithm for this has not yet been published in complete details,
but an outline of it can be found in our paper:

Robert J. Lang and Mu-Tsun Tsai,
_Generalized Offset Pythagorean Stretches in Box-Pleated Uniaxial Bases_,
The Proceedings from the 7th International Meeting on Origami in Science, Mathematics, and Education, Vol.2, 2018, pp. 591-606.

Roughly speaking, it consists of the following steps.

1. Group all `ValidJunction`s and create `Stretch` objects for each group.
2. For each `Stretch`, a `Repository` object will be in charge for searching possible
   `Configuration`s for its current structure. The entry point is at `configGenerator`.
3. For each possible `Configuration`, it will first generate possible `Device`s for each of its `Partition`.
4. The `Devices` are then put together through a `Positioner` function,
   and if the positioning is successful, we have found a valid `Pattern`.

## Tracing hinge contours

Once the stretch patterns are found,
the next big thing is to render the correct hinge contours for the flaps and rivers.
Naively, it may appear that it suffices to reflect all hinge about the ridges of the stretch patterns,
but in reality it is a lot more complicated than that,
as such method only works when the entire layout is valid,
and here we still want to make sense out of invalid layouts as much as possible.

The algorithm roughly goes as follows.

1. Create the `RoughContour`s for all flaps and rivers.
   For flaps, those are exactly the AABB of itself.
   For rivers, those will be the union of the expanded rough contour of its children.
   As those are axis-aligned polygons,
   taking their union can be made much faster than taking general polygon unions,
   and will work in most (say over 90%) of the scenarios.
2. Check if the union contours expose all the relevant `Quadrant` corners.
   For those `Quadrant`s with corners missing in the union,
   we need to keep the relevant component separate from the overall union.
   Those are known as the "raw contours".
3. Break the contours (union or raw) into `HingeSegments`,
   and decide the starting/ending point of tracing for each segment.
4. Pass the input to the tracing algorithm and generate `PatternContour`s.
5. Combine the `PatternContour` with the `RoughContour`.
   If raw contours are used in step 2,
   we need to take the general polygon union of the result.
