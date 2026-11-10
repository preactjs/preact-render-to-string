---
"preact-render-to-string": patch
---

Report errors in streamed Suspense boundaries through `onError` and leave the boundary to the client instead of streaming `undefined` or failing silently. Aborting now ends the response, and cancelling a `renderToReadableStream` stops the render.
