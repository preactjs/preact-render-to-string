---
"preact-render-to-string": minor
---

Implement hook state settling. Setting hook state during the execution of a function component (eg: in `useMemo`) will now re-render the component and use the final result. Previously, these updates were dropped.
