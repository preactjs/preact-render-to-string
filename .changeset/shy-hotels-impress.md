---
'preact-render-to-string': minor
---

Add experimental ability to render HTML comments via `<Fragment UNSTABLE_comment="my-comment" />`. When the `UNSTABLE_comment` prop is present all children of that `Fragment` will be ignored and a HTML comment will be rendered instead. This feature is added to allow framework authors to experiment with marking DOM for hydration in the client. Note that it's marked as unstable and might change in the future.
