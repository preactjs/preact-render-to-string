# preact-render-to-string

[![NPM](http://img.shields.io/npm/v/preact-render-to-string.svg)](https://www.npmjs.com/package/preact-render-to-string)
[![Build status](https://github.com/preactjs/preact-render-to-string/actions/workflows/ci.yml/badge.svg)](https://github.com/preactjs/preact-render-to-string/actions/workflows/ci.yml)

Render JSX and [Preact](https://github.com/preactjs/preact) components to an HTML string.

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
		return <span class="fox">{name}</span>;
	}
}

// ... and so do pure functional components:
const Box = ({ type, children }) => (
	<div class={`box box-${type}`}>{children}</div>
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
		<h5>{name}</h5>
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

### Error Boundaries

Rendering errors can be caught by Preact via `getDerivedStateFromErrors` or `componentDidCatch`. To enable that feature in `preact-render-to-string` set `errorBoundaries = true`

```js
import { options } from 'preact';

// Enable error boundaries in `preact-render-to-string`
options.errorBoundaries = true;
```

---

### `Suspense` & `lazy` components with [`preact/compat`](https://www.npmjs.com/package/preact)

```bash
npm install preact preact-render-to-string
```

```jsx
export default () => {
	return <h1>Home page</h1>;
};
```

```jsx
import { Suspense, lazy } from 'preact/compat';

// Creation of the lazy component
const HomePage = lazy(() => import('./pages/home'));

const Main = () => {
	return (
		<Suspense fallback={<p>Loading</p>}>
			<HomePage />
		</Suspense>
	);
};
```

```jsx
import { renderToStringAsync } from 'preact-render-to-string';
import { Main } from './main';

const main = async () => {
	// Rendering of lazy components
	const html = await renderToStringAsync(<Main />);

	console.log(html);
	// <h1>Home page</h1>
};

// Execution & error handling
main().catch((error) => {
	console.error(error);
});
```

---

### Streaming

> [!NOTE]
> This is an early version of our streaming implementation.

Preact supports streaming HTML to the client incrementally, flushing `<Suspense>` fallbacks immediately and replacing them with the resolved content as data arrives. This reduces Time to First Byte and allows the browser to start parsing earlier.

#### `renderToReadableStream` — Web Streams

```jsx
import { renderToReadableStream } from 'preact-render-to-string/stream';
import { Suspense, lazy } from 'preact/compat';

const Profile = lazy(() => import('./Profile'));

const App = () => (
	<html>
		<head><title>My App</title></head>
		<body>
			<Suspense fallback={<p>Loading profile…</p>}>
				<Profile />
			</Suspense>
		</body>
	</html>
);

// Works in any Web Streams environment (Deno, Bun, Cloudflare Workers, …)
export default {
	fetch() {
		const stream = renderToReadableStream(<App />);

		// stream.allReady resolves once all suspended content has been flushed
		return new Response(stream, {
			headers: { 'Content-Type': 'text/html' }
		});
	}
};
```

The returned `ReadableStream` has an extra `allReady: Promise<void>` property that resolves once every suspended subtree has been written. Await it before sending the response if you need the complete document before anything is flushed (e.g. for static export). At which point you might be better off using `renderToStringAsync` though.

```js
const stream = renderToReadableStream(<App />);
await stream.allReady; // wait for full render
```

#### `renderToPipeableStream` — Node.js Streams

```jsx
import { createServer } from 'node:http';
import { renderToPipeableStream } from 'preact-render-to-string/stream-node';
import { Suspense, lazy } from 'preact/compat';

const Profile = lazy(() => import('./Profile'));

const App = () => (
	<html>
		<head><title>My App</title></head>
		<body>
			<Suspense fallback={<p>Loading profile…</p>}>
				<Profile />
			</Suspense>
		</body>
	</html>
);

createServer((req, res) => {
	res.setHeader('Content-Type', 'text/html');

	const { pipe, abort } = renderToPipeableStream(<App />, {
		onShellReady() {
			// Called once the synchronous shell is ready to stream.
			pipe(res);
		},
		onAllReady() {
			// Called once every suspended subtree has been flushed.
		},
		onError(error) {
			console.error(error);
			res.statusCode = 500;
		}
	});

	// Optional: abort the render after a timeout
	setTimeout(abort, 10_000);
}).listen(8080);
```

| Option | Description |
|---|---|
| `onShellReady()` | Called synchronously once the initial shell has been rendered and streaming is about to start. Pipe here for fastest TTFB. |
| `onAllReady()` | Called after all `<Suspense>` boundaries have resolved and the stream is complete. |
| `onError(error)` | Called for render errors inside suspended subtrees. |

Calling `abort()` stops the render and destroys the stream; any pending suspended subtrees are dropped.

---

### License

[MIT](http://choosealicense.com/licenses/mit/)
