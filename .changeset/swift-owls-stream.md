---
"preact-render-to-string": minor
---

Stream deferred content using DPU `<template for>` patches and a MutationObserver client script instead of `<preact-island>` custom elements.

Fallbacks are wrapped with processing-instruction markers, and SVG/MathML subtrees are re-parsed so they display correctly after replacement. Late `$p:` patches skip client-owned DOM so hydration is not overwritten. Streaming is still alpha, so this wire-format change is a minor.
