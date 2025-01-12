---
'preact-render-to-string': patch
---

Fix issue where subtree re-render for Suspense boundaries caused a circular reference in the VNode's parent
