---
'preact-render-to-string': patch
---

Every streamed Suspense boundary now marks its range, also when nothing in it suspended (`<!--$s:-->…<!--/$s-->`), and the streaming init script renames a patched range to `$s::id`. Hydration can then tell which boundary a marker belongs to.
