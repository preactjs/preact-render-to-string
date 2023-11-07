---
'preact-render-to-string': minor
---

Add support for precompiled JSX transform, see https://deno.com/blog/v1.38#fastest-jsx-transform. Compared to traditional JSX transforms, the precompiled JSX transform tries to pre-serialize as much of the JSX as possible. That way less objects need to be created and serialized which relieves a lot of GC pressure.

```jsx
// input
<div class="foo">hello</div>;

// output
const tpl = [`<div class="foo">hello</div>`];
jsxTemplate(tpl);
```
