---
'preact-render-to-string': patch
---

Only abort/report errors from `renderToPipeableStream()` if the stream hasn't already been closed
