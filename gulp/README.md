
# Gulp Tasks

This folder contains all the tasks and configurations that are used to build the project.


## Why Gulp?

Gulp allows a high level of customization/optimization unmatched by other toolchains.
I have complete control over what is done in every step of the building process,
and can easily write quick plugins to perform any task I want to do.


## Comments on configurations

Since node.js does not natively support requiring JSON files with comments,
I cannot directly comment on the configurations and will have to put those here.

### HTML configuration

In `minifyJS` we specify that `"ie8": true`,
this is required to make the script runnable even in IE 8 so that at least the error messages can be displayed.
Not that I think there's anyone that still uses IE 8, but that there's no downside of doing so.
The only difference result in this setting is that the `catch` variables are mangled in a non-shadowing way.
