
# Polyfill

This section contains the polyfills used in BP Studio,
mainly to push the browser compatibility to as far as Safari 11.
All polyfills here are written by myself, without borrowing from any existing libraries.

When it comes to polyfill,
[core-js](https://github.com/zloirock/core-js) easily come into mind,
but I deliberately don't use it here for the following reasons:

1. It barely covers any web API related features.
2. Its codes and import chains are, in my opinion, unnecessarily complex.
3. I don't want to be one of the "ungrateful users" (paraphrased) implied by its author Denis Pushkarev.
   (See https://github.com/zloirock/core-js/blob/master/docs/2023-02-14-so-whats-next.md)
   It's not that I don't sympathize with his plight and situation,
   as I myself have also been asking for support for this project,
   but I can't agree with his response when (naturally) very few people are willing to sponsor.
   I think people should not be doing open-source work beyond their capacities in the first place,
   let alone complaining when they are overloaded.
