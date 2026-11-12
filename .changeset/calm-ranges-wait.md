---
'preact-render-to-string': patch
---

The streaming init script no longer walks the client's vnodes: a range is still the server's for as long as its `<?start>` marker is there.
