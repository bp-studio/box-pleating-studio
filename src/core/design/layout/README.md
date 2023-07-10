
# Layout

This section handles the searching for stretch pattern and the calculation of contours.

## Stretch pattern searching

The algorithm for this has not yet been published in complete details,
but an outline of it can be found in our paper:

Robert J. Lang and Mu-Tsun Tsai,
_Generalized Offset Pythagorean Stretches in Box-Pleated Uniaxial Bases_,
The Proceedings from the 7th International Meeting on Origami in Science, Mathematics, and Education, Vol.2, 2018, pp. 591-606.

## Contour calculation

Naively, it may appear that it suffices to reflect all hinge about the ridges of the stretch patterns,
but in reality it is a lot more complicated than that,
as such method only works when the entire layout is valid,
and here we still want to make sense out of invalid layouts as much as possible.
And even if the layout is valid,
to completely determined the external ridges of stretch patterns is also a very difficult task in general.
So in our contour algorithm here we use many tricks to simplify the matter.
