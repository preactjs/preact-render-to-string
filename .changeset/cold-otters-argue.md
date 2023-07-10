---
'preact-render-to-string': minor
---

Add support for error boundaries via `componentDidCatch` and `getDerivedStateFromError`

This feature is disabled by default and can be enabled by toggling the `errorBoundaries` option:

```js
import { options } from 'preact';

// Enable error boundaries
options.errorBoundaries = true;
```
