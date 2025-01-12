---
'preact-render-to-string': patch
---

Ensure that the `_parent` is kept around across multiple suspensions and avoid circular references.
In doing so our `useId` hook should always output unique ids during renderingToString.
