---
'preact-render-to-string': patch
---

`renderToPipeableStream` flushes a destination that has a `flush()` method, such as a response behind Express's `compression()` middleware, so the shell and each boundary reach the browser as they render instead of all at the end. `pipe()` returns the destination, and a response that `onShellError` already ended is no longer destroyed.
