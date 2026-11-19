---
'preact-render-to-string': patch
---

Streamed boundaries are now numbered per render (`0`, `1`, … in base 36) instead of by vnode id, which keeps growing for as long as the server runs, and the closing marker of a range no longer repeats the id (`<!--/$s-->`). The streaming init script finds the closing marker by walking the siblings of the opening one. Pages with many boundaries stream fewer bytes.
