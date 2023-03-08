
# Panel

This section contains all types of panel components that are shown in the options panel.

Since they control various properties of the objects in a `Project`,
it is very important that none of them hold a `computed` value of an object,
as such a value will prevent the object from GC even after the component has unmounted.

My original solution was to introduce a `gcComputed` that clears its reference on unmount,
but the way it achieves that is by accessing a private field of `computed`,
and I don't think it's safe to do so in the long run.

My current solution is to pass the objects around as props of the components.
A little more involved, but work as intended.
