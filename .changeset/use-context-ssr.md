---
'preact-render-to-string': patch
---

Set the component's `_globalContext` so `use(Context)` from `preact/compat` (Preact 11) resolves the nearest provider instead of throwing.
