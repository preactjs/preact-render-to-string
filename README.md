# preact-render-to-string

[![NPM](http://img.shields.io/npm/v/preact-render-to-string.svg)](https://www.npmjs.com/package/preact-render-to-string)
[![travis-ci](https://travis-ci.org/preactjs/preact-render-to-string.svg)](https://travis-ci.org/preactjs/preact-render-to-string)

Render JSX and [Preact] components to an HTML string.

Works in Node & the browser, making it useful for universal/isomorphic rendering.

\>\> **[Cute Fox-Related Demo](http://codepen.io/developit/pen/dYZqjE?editors=001)** _(@ CodePen)_ <<


---


### Render JSX/VDOM to HTML

```js
import { render } from 'preact-render-to-string';
import { h } from 'preact';
/** @jsx h */

let vdom = <div class="foo">content</div>;

let html = render(vdom);
console.log(html);
// <div class="foo">content</div>
```


### Render Preact Components to HTML

```js
import { render } from 'preact-render-to-string';
import { h, Component } from 'preact';
/** @jsx h */

// Classical components work
class Fox extends Component {
	render({ name }) {
		return <span class="fox">{ name }</span>;
	}
}

// ... and so do pure functional components:
const Box = ({ type, children }) => (
	<div class={`box box-${type}`}>{ children }</div>
);

let html = render(
	<Box type="open">
		<Fox name="Finn" />
	</Box>
);

console.log(html);
// <div class="box box-open"><span class="fox">Finn</span></div>
```


---


### Render JSX / Preact / Whatever via Express!

```js
import express from 'express';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
/** @jsx h */

// silly example component:
const Fox = ({ name }) => (
	<div class="fox">
		<h5>{ name }</h5>
		<p>This page is all about {name}.</p>
	</div>
);

// basic HTTP server via express:
const app = express();
app.listen(8080);

// on each request, render and return a component:
app.get('/:fox', (req, res) => {
	let html = render(<Fox name={req.params.fox} />);
	// send it back wrapped up as an HTML5 document:
	res.send(`<!DOCTYPE html><html><body>${html}</body></html>`);
});
```


---

## Migration guide

### Migrating from 5.x to 6.x

The only breaking change introduced with the `6.x` is that the `default` exports have been removed in favor of named exports. To update, replace the default import in your code with a named one.

```diff
- import render from 'preact-render-to-string';
+ import { render } from 'preact-render-to-string';
```

Similarily if you've been using the `jsx` renderer, the default import needs to be swapped with a named import:

```diff
- import render from 'preact-render-to-string/jsx';
+ import { render } from 'preact-render-to-string/jsx';
```

_Note: The named exports were already present in the `5.x` release line. So if you can't update today for any reason, you can apply the above changes safely to make a future update to `6.x` easier!_

---


## License

[MIT]


[Preact]: https://github.com/developit/preact
[MIT]: http://choosealicense.com/licenses/mit/
