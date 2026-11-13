---
'preact-render-to-string': patch
---

A boundary that still holds its fallback now opens with `<!--$s?:id-->`, and the streaming init script renames it to `<!--$s:id-->` once it patched the content in. The script no longer walks the client's vnodes: a range is still the server's for as long as its `<?start>` marker is there.
