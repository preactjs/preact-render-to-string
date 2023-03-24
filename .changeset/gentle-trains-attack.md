---
'preact-render-to-string': major
---

Remove trailing space for void_elements, this could fail some test_assertions as
`<img />` will become `<img/>`, the other `VOID_ELEMENTS` this will be applied for
can be found [here](https://github.com/preactjs/preact-render-to-string/blob/remove-trailing-space/src/index.js#L368-L385)
