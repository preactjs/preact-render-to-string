---
'preact-render-to-string': major
---

Stream a boundary's content as `<template for>` (Declarative Partial Updates) instead of `<preact-island>`. Browsers that support it stream the content straight into the page while they parse it, and a small inline script patches it in everywhere else. A pending range now also holds `<?start>`/`<?end>` around its fallback, which mark what the template replaces. Table rows in a chunk keep their structure.
