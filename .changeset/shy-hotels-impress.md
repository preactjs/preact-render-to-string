---
'preact-render-to-string': minor
---

Add ability to render comments via `<Fragment comment="my-comment" />`. When the `comment` prop is present all children of that `Fragment` will be ignored. This PR only supports that in server environments as it's useful to mark islands and other things. It's not supported in the browser.

We picked a `Fragment` for this as it's the least common component and therefore the branch in our code with the least impact on perf by adding another if-check.
