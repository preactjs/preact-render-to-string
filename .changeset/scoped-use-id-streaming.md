---
'preact-render-to-string': patch
---

Streamed Suspense boundaries keep the `useId` values a client render gives them with Preact 11: a boundary that retries restarts its ids, and a fallback's ids no longer shift the ids after its boundary.
