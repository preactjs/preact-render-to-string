---
"preact-render-to-string": major
---

Stream deferred content using DPU `<template for>` patches and a small React-style init script instead of `<preact-island>` custom elements.

Each streamed chunk is a `<template for>` followed by an inline script call. Native DPU consumes the template while parsing; otherwise the init script polyfills the patch. Fallbacks are wrapped with processing-instruction markers, and SVG/MathML subtrees are re-parsed so they display correctly after replacement. The streamed wire format changes, so this is a major.
