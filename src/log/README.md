
# Log

This section contains the changelogs of BP Studio.

Originally, these log files are published directly,
and [Marked](https://marked.js.org/) is used to render them in front-end.
Since version 0.6, the log files are built into HTML ahead of time,
so that Marked is no longer needed in runtime,
saving overheads of library downloading, loading, and runtime parsing.
Output files are still in `.md` extension as a legacy.
