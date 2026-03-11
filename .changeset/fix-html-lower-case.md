---
"preact-render-to-string": patch
---

Replace `HTML_LOWER_CASE` regex with an explicit `Set` to prevent false matches on custom element properties (e.g. `channelId` being incorrectly lowercased to `channelid`)
