# preact-render-to-string

## 6.5.12

### Patch Changes

- [#397](https://github.com/preactjs/preact-render-to-string/pull/397) [`6db4f95`](https://github.com/preactjs/preact-render-to-string/commit/6db4f95ab3fc303b754765c11e64a72d9583d87b) Thanks [@rschristian](https://github.com/rschristian)! - Switch `HTML_LOWER_CASE` regex to match all from line start for a marginal perf benefit.

## 6.5.11

### Patch Changes

- [#393](https://github.com/preactjs/preact-render-to-string/pull/393) [`62ade27`](https://github.com/preactjs/preact-render-to-string/commit/62ade2779e9956287b53cb4b608bdba671a5e3ac) Thanks [@rschristian](https://github.com/rschristian)! - Fix `spellcheck={false}` not rendering as `spellcheck="false"`

## 6.5.10

### Patch Changes

- [#391](https://github.com/preactjs/preact-render-to-string/pull/391) [`d80e4dc`](https://github.com/preactjs/preact-render-to-string/commit/d80e4dccecbc7394d2eb903b85a2a8d31a12c8cb) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Allow any value for `class` + `className` as long as it's stringified to match browser behavior.

## 6.5.9

### Patch Changes

- [#388](https://github.com/preactjs/preact-render-to-string/pull/388) [`4621fa3`](https://github.com/preactjs/preact-render-to-string/commit/4621fa3339324fef30894f28a2d57ce4dfe9f5ef) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Fix `spellCheck={false}` not rendering as `spellcheck="false"`

## 6.5.8

### Patch Changes

- [#386](https://github.com/preactjs/preact-render-to-string/pull/386) [`220ad45`](https://github.com/preactjs/preact-render-to-string/commit/220ad45cc2674cc7d927ca52d555ea8e5ec2ddbc) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Add async benchmarks and iterate on perf improvements

* [#383](https://github.com/preactjs/preact-render-to-string/pull/383) [`883e02b`](https://github.com/preactjs/preact-render-to-string/commit/883e02bac3277daea157d996fbed406a71bf2901) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - General performance optimisations

- [#385](https://github.com/preactjs/preact-render-to-string/pull/385) [`45b8e8b`](https://github.com/preactjs/preact-render-to-string/commit/45b8e8b2f4ee1a9653601560ca363ae87b56e0d9) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Improve perf a bit by hoisting the typeof check to reduce calling typeof

## 6.5.7

### Patch Changes

- [#381](https://github.com/preactjs/preact-render-to-string/pull/381) [`481b4f3`](https://github.com/preactjs/preact-render-to-string/commit/481b4f3c6602d9cdab1f8c3c884edb938099c603) Thanks [@rschristian](https://github.com/rschristian)! - Support `dangerouslySetInnerHTML={undefined}` with `renderToStringAsync`

## 6.5.6

### Patch Changes

- [#378](https://github.com/preactjs/preact-render-to-string/pull/378) [`054dae0`](https://github.com/preactjs/preact-render-to-string/commit/054dae0ae9dc0ab5b86c1c7fd9712b640a09111d) Thanks [@ccouzens](https://github.com/ccouzens)! - Fix issue where preactRenderToString returns a promise of a promise

## 6.5.5

### Patch Changes

- [#372](https://github.com/preactjs/preact-render-to-string/pull/372) [`bebe4bf`](https://github.com/preactjs/preact-render-to-string/commit/bebe4bf807f663ed795f1f039222a9a71f741dad) Thanks [@jacob-ebey](https://github.com/jacob-ebey)! - fix: stop client runtime from being corrupted
  fix: insert ooo chunks in the proper order

## 6.5.4

### Patch Changes

- [#370](https://github.com/preactjs/preact-render-to-string/pull/370) [`7871a51`](https://github.com/preactjs/preact-render-to-string/commit/7871a5145183f205b013238b8442a6bc28f5db89) Thanks [@dbergey](https://github.com/dbergey)! - Fix incorrect type for renderToPipeableStream

## 6.5.3

### Patch Changes

- [#362](https://github.com/preactjs/preact-render-to-string/pull/362) [`3044ac2`](https://github.com/preactjs/preact-render-to-string/commit/3044ac204dd6ff416fb63aa778616cbce40fc043) Thanks [@rschristian](https://github.com/rschristian)! - Correct stream exports

* [#367](https://github.com/preactjs/preact-render-to-string/pull/367) [`8c7e08f`](https://github.com/preactjs/preact-render-to-string/commit/8c7e08f121d4fb5967c0fc63b6aafd45e1613162) Thanks [@rschristian](https://github.com/rschristian)! - Add types for `/stream` and `/stream-node` exports

## 6.5.2

### Patch Changes

- [#360](https://github.com/preactjs/preact-render-to-string/pull/360) [`689e88d`](https://github.com/preactjs/preact-render-to-string/commit/689e88d9db6e14ea101d37f2a454afb96f926594) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Correctly render `null` as an `__html` value as an empty string

## 6.5.1

### Patch Changes

- [#356](https://github.com/preactjs/preact-render-to-string/pull/356) [`4430ecf`](https://github.com/preactjs/preact-render-to-string/commit/4430ecfff5b3c400721295e34f61c6cc0d55c62d) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Add back publish with provenance

## 6.5.0

### Minor Changes

- [#354](https://github.com/preactjs/preact-render-to-string/pull/354) [`a004914`](https://github.com/preactjs/preact-render-to-string/commit/a0049143e73b3710eeb4c4250c4e03b2a1ff6643) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Introduce a streaming renderer which can be imported from `preact-render-to-string/stream` and `preact-render-to-string/stream-node`

### Patch Changes

- [#354](https://github.com/preactjs/preact-render-to-string/pull/354) [`a004914`](https://github.com/preactjs/preact-render-to-string/commit/a0049143e73b3710eeb4c4250c4e03b2a1ff6643) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Ensure `popoverTarget` and `popoverTargetAction` are serialized to lower case

* [#354](https://github.com/preactjs/preact-render-to-string/pull/354) [`a004914`](https://github.com/preactjs/preact-render-to-string/commit/a0049143e73b3710eeb4c4250c4e03b2a1ff6643) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Fix for shallow rendering incorrectly transforming Fragments into other nodes

- [#354](https://github.com/preactjs/preact-render-to-string/pull/354) [`a004914`](https://github.com/preactjs/preact-render-to-string/commit/a0049143e73b3710eeb4c4250c4e03b2a1ff6643) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Ensure `cellPadding`, `cellSpacing`, and `useMap` are serialized to lower case

* [#354](https://github.com/preactjs/preact-render-to-string/pull/354) [`a004914`](https://github.com/preactjs/preact-render-to-string/commit/a0049143e73b3710eeb4c4250c4e03b2a1ff6643) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - streaming rendering with Suspense boundaries as flush trigger

## 6.4.2

### Patch Changes

- [#347](https://github.com/preactjs/preact-render-to-string/pull/347) [`7bc77a3`](https://github.com/preactjs/preact-render-to-string/commit/7bc77a3cb859069cddf0befc9bd247b2a137f10a) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Fix JSX template being detected as a top level Fragment when Deno's jsx `precompile` option is used

* [#348](https://github.com/preactjs/preact-render-to-string/pull/348) [`303b8c0`](https://github.com/preactjs/preact-render-to-string/commit/303b8c0990f74648b23343c9e725899122cbded1) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Perf: Remove unnecessary closure when rendering child nodes

## 6.4.1

### Patch Changes

- [#344](https://github.com/preactjs/preact-render-to-string/pull/344) [`27a8b0e`](https://github.com/preactjs/preact-render-to-string/commit/27a8b0e0654663e31df01e03f5bf34c74ec76e67) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Ensure commonjs also has the async export

* [#336](https://github.com/preactjs/preact-render-to-string/pull/336) [`c46fb59`](https://github.com/preactjs/preact-render-to-string/commit/c46fb593eaf0c0be699acba6b9953dd01da0ea81) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Fix error thrown after suspending not being rethrown.

- [#339](https://github.com/preactjs/preact-render-to-string/pull/339) [`4462822`](https://github.com/preactjs/preact-render-to-string/commit/44628228dec6b10c59023c21e17a140f205ed0c9) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Fix invalid parent pointer empty value when rendering a suspended vnode

## 6.4.0

### Minor Changes

- [#333](https://github.com/preactjs/preact-render-to-string/pull/333) [`6acc97a`](https://github.com/preactjs/preact-render-to-string/commit/6acc97aee994bd8291564032307f301745c1ed18) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Allow prepass like behavior where a Promise
  will be awaited and then continued, this is done with
  the new `renderToStringAsync` export

### Patch Changes

- [#326](https://github.com/preactjs/preact-render-to-string/pull/326) [`87d8c21`](https://github.com/preactjs/preact-render-to-string/commit/87d8c21e61c8fb9c1ec9d8d69a826bfb3e5db9af) Thanks [@Geo25rey](https://github.com/Geo25rey)! - fix external type definitions of `renderToString`

* [#329](https://github.com/preactjs/preact-render-to-string/pull/329) [`0a0d0ce`](https://github.com/preactjs/preact-render-to-string/commit/0a0d0ceba22d89fa82a177305c7e44aa22202398) Thanks [@acelaya](https://github.com/acelaya)! - Remove incorrect second default export from jsx.d.ts

## 6.3.1

### Patch Changes

- [#324](https://github.com/preactjs/preact-render-to-string/pull/324) [`6bf321d`](https://github.com/preactjs/preact-render-to-string/commit/6bf321d31d97d679910f892d4310ae79b3a70e84) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Fix mapped children not working with Deno's new precompile JSX transform.

## 6.3.0

### Minor Changes

- [`926827c`](https://github.com/preactjs/preact-render-to-string/commit/926827c0745889545a97774535e778da3c808dd0) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Add support for precompiled JSX transform, see https://deno.com/blog/v1.38#fastest-jsx-transform. Compared to traditional JSX transforms, the precompiled JSX transform tries to pre-serialize as much of the JSX as possible. That way less objects need to be created and serialized which relieves a lot of GC pressure.

  ```jsx
  // input
  <div class="foo">hello</div>;

  // output
  const tpl = [`<div class="foo">hello</div>`];
  jsxTemplate(tpl);
  ```

## 6.2.2

### Patch Changes

- [#315](https://github.com/preactjs/preact-render-to-string/pull/315) [`f1d81be`](https://github.com/preactjs/preact-render-to-string/commit/f1d81be1e56d64bf7bf0ecc975a7b54d2db2ad45) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - avoid adding double colon for namespaced attributes

## 6.2.1

### Patch Changes

- [#308](https://github.com/preactjs/preact-render-to-string/pull/308) [`a331699`](https://github.com/preactjs/preact-render-to-string/commit/a331699666e38d33554bdd85fb1afdef82051ec5) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Fix incorrect casing of HTML attributes and SVG attributes

* [#310](https://github.com/preactjs/preact-render-to-string/pull/310) [`017a8bb`](https://github.com/preactjs/preact-render-to-string/commit/017a8bb41211f88ee01138b0830005fac1c93e02) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Fix casing of namespaced attribute names

- [#311](https://github.com/preactjs/preact-render-to-string/pull/311) [`bccd1d6`](https://github.com/preactjs/preact-render-to-string/commit/bccd1d6b4094a8481282484b0d6ca20677ce2532) Thanks [@gpoitch](https://github.com/gpoitch)! - Apply attribute name handling in pretty mode

## 6.2.0

### Minor Changes

- [#305](https://github.com/preactjs/preact-render-to-string/pull/305) [`568f139`](https://github.com/preactjs/preact-render-to-string/commit/568f139a6c7916e0b6eebb7c51f1abf035850b7c) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Add support for error boundaries via `componentDidCatch` and `getDerivedStateFromError`

  This feature is disabled by default and can be enabled by toggling the `errorBoundaries` option:

  ```js
  import { options } from 'preact';

  // Enable error boundaries
  options.errorBoundaries = true;
  ```

## 6.1.0

### Minor Changes

- [#301](https://github.com/preactjs/preact-render-to-string/pull/301) [`659b456`](https://github.com/preactjs/preact-render-to-string/commit/659b45623093ae0a93cb29354b069a25cf6351b5) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Add experimental ability to render HTML comments via `<Fragment UNSTABLE_comment="my-comment" />`. When the `UNSTABLE_comment` prop is present all children of that `Fragment` will be ignored and a HTML comment will be rendered instead. This feature is added to allow framework authors to experiment with marking DOM for hydration in the client. Note that it's marked as unstable and might change in the future.

## 6.0.3

### Patch Changes

- [#298](https://github.com/preactjs/preact-render-to-string/pull/298) [`6a4b8ed`](https://github.com/preactjs/preact-render-to-string/commit/6a4b8edc3b60038d2dc539a9652db806c5c24616) Thanks [@shinyama-k](https://github.com/shinyama-k)! - Fix to add type file for jsx.js

## 6.0.2

### Patch Changes

- [#294](https://github.com/preactjs/preact-render-to-string/pull/294) [`637b302`](https://github.com/preactjs/preact-render-to-string/commit/637b3021ff05a0729a1a7c0eb965ce3fc3556af6) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Bring back exports from 5.x to make migration easier

## 6.0.1

### Patch Changes

- [#292](https://github.com/preactjs/preact-render-to-string/pull/292) [`8f4692c`](https://github.com/preactjs/preact-render-to-string/commit/8f4692c49277591819acb74808a0e28f7cb30c2f) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Fix error in commonjs entry point

## 6.0.0

### Major Changes

- [#241](https://github.com/preactjs/preact-render-to-string/pull/241) [`e8cbf66`](https://github.com/preactjs/preact-render-to-string/commit/e8cbf66b2620842671b5c95817454ff2ddb0e450) Thanks [@developit](https://github.com/developit)! - Improve performance by another 5-10% using `switch` and short-circuiting, and move pretty-printing from into `preact-render-to-string/jsx`.

* [#282](https://github.com/preactjs/preact-render-to-string/pull/282) [`6376f62`](https://github.com/preactjs/preact-render-to-string/commit/6376f62309ec19482ded68406a03910ad6de57d1) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Remove trailing space for void_elements, this could fail some test_assertions as
  `<img />` will become `<img/>`, the other `VOID_ELEMENTS` this will be applied for
  can be found [here](https://github.com/preactjs/preact-render-to-string/blob/remove-trailing-space/src/index.js#L368-L385)

- [#286](https://github.com/preactjs/preact-render-to-string/pull/286) [`7a8b590`](https://github.com/preactjs/preact-render-to-string/commit/7a8b590237a70e8708e46cb1d92ab24327f60160) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Remove the castin to VNode for `preact/debug`, this is fixed in Preact >= 10.13.0

### Patch Changes

- [#286](https://github.com/preactjs/preact-render-to-string/pull/286) [`7a8b590`](https://github.com/preactjs/preact-render-to-string/commit/7a8b590237a70e8708e46cb1d92ab24327f60160) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Change style calculation to use a Set rather than Regex

* [#285](https://github.com/preactjs/preact-render-to-string/pull/285) [`a0546fe`](https://github.com/preactjs/preact-render-to-string/commit/a0546fe6a008eca54edfcd97f775c4b5581d086c) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Fix CJS export

- [#288](https://github.com/preactjs/preact-render-to-string/pull/288) [`0b04860`](https://github.com/preactjs/preact-render-to-string/commit/0b0486029ca10a846c368a0ab404e4b2e8eb96d6) Thanks [@glenchao](https://github.com/glenchao)! - Enumerate draggable attribute, so the output isn't `draggable` but `draggable="true"`

* [#283](https://github.com/preactjs/preact-render-to-string/pull/283) [`3defa9d`](https://github.com/preactjs/preact-render-to-string/commit/3defa9dab48cc7379c9135d92273fbb7f886cab0) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Follow up fixes to #278

- [#289](https://github.com/preactjs/preact-render-to-string/pull/289) [`07ebc66`](https://github.com/preactjs/preact-render-to-string/commit/07ebc66bb76b775cae58b5163acf2943ec72c8bf) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Support `data` attribute

* [#270](https://github.com/preactjs/preact-render-to-string/pull/270) [`5c6877d`](https://github.com/preactjs/preact-render-to-string/commit/5c6877d13d60b4cdd87632ac3052b006207568ff) Thanks [@developit](https://github.com/developit)! - improve unmount option hook call performance

- [#278](https://github.com/preactjs/preact-render-to-string/pull/278) [`8cf7cef`](https://github.com/preactjs/preact-render-to-string/commit/8cf7cef0e96b3e48ffea5fcf4f76db6410de8346) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Improve performance by

  - storing the void_elements in a Set
  - hoisting the `x-link` regex
  - remove case-insensitive from regexes and calling `.toLowerCase()` instead
  - caching suffixes for css-props

## 5.2.6

### Patch Changes

- [#257](https://github.com/preactjs/preact-render-to-string/pull/257) [`8b944b2`](https://github.com/preactjs/preact-render-to-string/commit/8b944b28be64d470a947f999153c9b64b078f7a8) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Fix `preact/debug` incorrectly throwing errors on text children

## 5.2.5

### Patch Changes

- [#246](https://github.com/preactjs/preact-render-to-string/pull/246) [`ad35c4c`](https://github.com/preactjs/preact-render-to-string/commit/ad35c4c931db37837761038d33ae71fa31ebc9e3) Thanks [@developit](https://github.com/developit) and [@marvinhagemeister](https://github.com/marvinhagemeister)! - Fix object and function children being rendered as `undefined`

* [#248](https://github.com/preactjs/preact-render-to-string/pull/248) [`aa12b3c`](https://github.com/preactjs/preact-render-to-string/commit/aa12b3c61528813c7a3978410d1d551afbdb08ba) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Fix vnode masks not matching with core due to top level component Fragments

## 5.2.4

### Patch Changes

- [#242](https://github.com/preactjs/preact-render-to-string/pull/242) [`bd5e5eb`](https://github.com/preactjs/preact-render-to-string/commit/bd5e5eb1c97355d81710c17a10208b1cb3b439a0) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - correctly unmount vnodes

* [#237](https://github.com/preactjs/preact-render-to-string/pull/237) [`dec7a7a`](https://github.com/preactjs/preact-render-to-string/commit/dec7a7a575149187942adb92f644c302db4b0599) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - add parent and children for useId

## 5.2.3

### Patch Changes

- [#232](https://github.com/preactjs/preact-render-to-string/pull/232) [`2d5ca74`](https://github.com/preactjs/preact-render-to-string/commit/2d5ca74646f2f9f2e9ddeb20ed9c3fc47171c264) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Performance enhancements

* [#238](https://github.com/preactjs/preact-render-to-string/pull/238) [`7cdf4d6`](https://github.com/preactjs/preact-render-to-string/commit/7cdf4d67abba622124902e53e016affbbebc647e) Thanks [@developit](https://github.com/developit)! - Fix the order of invocation for the "before diff" (`__b`) and "diffed" [options hooks](https://preactjs.com/guide/v10/options/).

## 5.2.2

### Patch Changes

- [#235](https://github.com/preactjs/preact-render-to-string/pull/235) [`2f6d6e8`](https://github.com/preactjs/preact-render-to-string/commit/2f6d6e8dd0573eb075273c2c9a20d7df289dacc8) Thanks [@marvinhagemeister](https://github.com/marvinhagemeister)! - Remove duplicate type path in `package.json`. Only one of `types` or `typings` is needed.

* [#228](https://github.com/preactjs/preact-render-to-string/pull/228) [`e4fe799`](https://github.com/preactjs/preact-render-to-string/commit/e4fe7992d717eb3cb8740d2d28696bf2ba6c3d1e) Thanks [@developit](https://github.com/developit)! - Improve string encoding performance by ~50%

- [#229](https://github.com/preactjs/preact-render-to-string/pull/229) [`d83def7`](https://github.com/preactjs/preact-render-to-string/commit/d83def7c1765c4ad1665598905531f5157366abd) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Split up hot paths and make separate path for opts.pretty

## 5.2.1

### Patch Changes

- [#224](https://github.com/preactjs/preact-render-to-string/pull/224) [`645f3cb`](https://github.com/preactjs/preact-render-to-string/commit/645f3cb0d5364bcf945cb498e44dcbd381183c90) Thanks [@rschristian](https://github.com/rschristian)! - Ensures `defaultChecked` is serialized as `checked` attribute

* [#225](https://github.com/preactjs/preact-render-to-string/pull/225) [`31ac323`](https://github.com/preactjs/preact-render-to-string/commit/31ac32332c49876b84f73beb1e0732e76283cc5f) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Optimize perf by using smarter string builder

## 5.2.0

### Minor Changes

- [#219](https://github.com/preactjs/preact-render-to-string/pull/219) [`250c15f`](https://github.com/preactjs/preact-render-to-string/commit/250c15fbc01e28c3934689e2a846e441709d829f) Thanks [@developit](https://github.com/developit)! - Implement hook state settling. Setting hook state during the execution of a function component (eg: in `useMemo`) will now re-render the component and use the final result. Previously, these updates were dropped.

## 5.1.21

### Patch Changes

- [#215](https://github.com/preactjs/preact-render-to-string/pull/215) [`a8672db`](https://github.com/preactjs/preact-render-to-string/commit/a8672db2be9eb96f29d778d1fcea58d00cb5ce44) Thanks [@AleksandrHovhannisyan](https://github.com/AleksandrHovhannisyan)! - Don't add selected attribute to <option> elements if they already contain that attribute

## 5.1.20

### Patch Changes

- [#209](https://github.com/preactjs/preact-render-to-string/pull/209) [`298d05e`](https://github.com/preactjs/preact-render-to-string/commit/298d05e5a29620ee9865b4cdb14c28464eebbd47) Thanks [@rschristian](https://github.com/rschristian)! - On empty className w/ compat, class attribute will no longer be duplicated

* [#205](https://github.com/preactjs/preact-render-to-string/pull/205) [`6d47c5a`](https://github.com/preactjs/preact-render-to-string/commit/6d47c5ae3821a11232d865687e97b1d37faa955f) Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Fix serialize defaultValue as value attribute
