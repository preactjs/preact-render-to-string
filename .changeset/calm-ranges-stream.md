---
'preact-render-to-string': major
---

Mark the range of every `<Suspense>` boundary in the HTML, so the client hydrates each boundary as one unit once all of its content has arrived.

- A boundary that is still to be streamed is written as `<!--$s?id-->fallback<!--/$s?id-->`. Its content follows in `<preact-island hidden data-target="id">…</preact-island>`, the same element as before. The island moves the content into the range once a node follows it (the server writes a newline after each island), then tells hydration the content is there.
- A boundary whose content is in the HTML is written as `<!--$s=-->…<!--/$s-->`, in `renderToString` and `renderToStringAsync` too. One that is left to the client is written as `<!--$s!-->fallback<!--/$s-->`.
- While streaming, the range of a boundary covers all of its children. What a boundary rendered before one of its children suspended is sent with its chunk, and a boundary nested in it is never sent before the HTML that holds its range.

Hydrating these ranges needs the matching Preact release. The markup changes for every `<Suspense>`, so this is a major.
