---
'preact-render-to-string': patch
---

Skip `on*` props instead of serializing them as attributes, matching Preact, which only binds function values as event listeners.
