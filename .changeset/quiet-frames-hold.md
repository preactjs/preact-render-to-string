---
'preact-render-to-string': patch
---

A streamed boundary's fallback range now covers all of its children when the component that suspends is wrapped in another component. Before, the siblings around the wrapper were rendered outside the range and streamed a second time with the content. Only Suspense-like classes are boundaries now, so a component that catches suspensions on its instance (preact-iso's `Router`) no longer streams all of its children. Retries render with the boundary's context.
