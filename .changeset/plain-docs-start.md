---
'preact-render-to-string': patch
---

A streamed full document now starts with `<!DOCTYPE html>` when nothing in it suspends too, so a page no longer switches to quirks mode once its data or lazy modules are cached on the server.
