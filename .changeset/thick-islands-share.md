---
"preact-render-to-string": patch
---

Improve performance by

- storing the void_elements in a Set
- hoisting the `x-link` regex
- remove case-insensitive from regexes and calling `.toLowerCase()` instead
- caching suffixes for css-props
