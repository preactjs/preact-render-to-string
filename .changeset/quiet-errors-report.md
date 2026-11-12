---
"preact-render-to-string": patch
---

Handle streaming errors the way React does. An error below a Suspense boundary is reported through `onError` and the boundary is left to the client, only an error outside of every boundary fails the render (`onShellError`). Aborting reports every pending boundary, hands it to the client and ends the response, as does a destination that closes early or a cancelled `renderToReadableStream`.
