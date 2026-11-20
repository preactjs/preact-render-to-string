import { h, createContext } from 'preact';
import { expect, describe, it } from 'vitest';
import { Suspense } from 'preact/compat';
import { useId, useContext } from 'preact/hooks';
import { renderToChunks } from '../../src/lib/chunked';
import {
	createSubtree,
	createInitScript,
	createClientRenderInstruction
} from '../../src/lib/client';
import { Deferred } from '../../src/lib/util';
import { createSuspender } from '../utils';
import { VNODE, PARENT } from '../../src/lib/constants';

describe('renderToChunks', () => {
	it('should render non-suspended JSX in one go', async () => {
		const result = [];
		await renderToChunks(<div class="foo">bar</div>, {
			onWrite: (s) => result.push(s)
		});

		expect(result).toEqual(['<div class="foo">bar</div>']);
	});

	it('should include the $PRS helper in the init script', () => {
		expect(createInitScript()).toContain('window.$PRS=');
		expect(createSubtree('1', '<p>x</p>')).toContain('template for="1"');
		expect(createSubtree('1', '<p>x</p>')).toContain(
			'<script data-p="1">$PRS()</script>'
		);
	});

	it('should render fallback + attach loaded subtree on suspend', async () => {
		const { Suspender, suspended } = createSuspender();

		const result = [];
		const promise = renderToChunks(
			<div>
				<Suspense fallback="loading...">
					<Suspender />
				</Suspense>
			</div>,
			{ onWrite: (s) => result.push(s) }
		);
		suspended.resolve();

		await promise;

		expect(result).to.deep.equal([
			`<div><!--$s?:0--><?start name="0">loading...<?end><!--/$s--></div>`,
			createInitScript(),
			createSubtree('0', '<p>it works</p>')
		]);
	});

	it('should number the boundaries of every render from 0', async () => {
		const render = async () => {
			const first = createSuspender();
			const second = createSuspender();
			const result = [];
			const promise = renderToChunks(
				<div>
					<Suspense fallback="a">
						<first.Suspender />
					</Suspense>
					<Suspense fallback="b">
						<second.Suspender />
					</Suspense>
				</div>,
				{ onWrite: (s) => result.push(s) }
			);
			second.suspended.resolve();
			await second.suspended.promise;
			first.suspended.resolve();
			await promise;
			return result;
		};

		const expected = [
			`<div><!--$s?:0--><?start name="0">a<?end><!--/$s--><!--$s?:1--><?start name="1">b<?end><!--/$s--></div>`,
			createInitScript(),
			createSubtree('1', '<p>it works</p>'),
			createSubtree('0', '<p>it works</p>')
		];
		expect(await render()).to.deep.equal(expected);
		expect(await render()).to.deep.equal(expected);
	});

	it('should abort pending suspensions with AbortSignal', async () => {
		const { Suspender, suspended } = createSuspender();

		const controller = new AbortController();
		const result = [];
		const promise = renderToChunks(
			<div>
				<Suspense fallback="loading...">
					<Suspender />
				</Suspense>
			</div>,
			{
				onWrite: (s) => result.push(s),
				onError: () => {},
				abortSignal: controller.signal
			}
		);

		controller.abort();
		await promise;

		suspended.resolve();

		expect(result).to.deep.equal([
			`<div><!--$s?:0--><?start name="0">loading...<?end><!--/$s--></div>`,
			createInitScript(),
			createClientRenderInstruction('0')
		]);
	});

	it('should encounter no circular references when rendering a suspense boundary subtree', async () => {
		const { Suspender, suspended } = createSuspender();

		const visited = new Set();
		let circular = false;

		function CircularReferenceCheck() {
			let root = this[VNODE];
			while (root !== null && root[PARENT] !== null) {
				if (visited.has(root)) {
					// Can't throw an error here, _catchError handler will also loop infinitely
					circular = true;
					break;
				}
				visited.add(root);
				root = root[PARENT];
			}
			return <p>it works</p>;
		}

		const result = [];
		const promise = renderToChunks(
			<div>
				<Suspense fallback="loading...">
					<Suspender>
						<CircularReferenceCheck />
					</Suspender>
				</Suspense>
			</div>,
			{ onWrite: (s) => result.push(s) }
		);

		suspended.resolve();
		await promise;

		if (circular) {
			throw new Error('CircularReference');
		}

		expect(result).to.deep.equal([
			`<div><!--$s?:0--><?start name="0">loading...<?end><!--/$s--></div>`,
			createInitScript(),
			createSubtree('0', '<p>it works</p>')
		]);
	});

	it('should support using useId hooks inside a suspense boundary', async () => {
		const { Suspender, suspended } = createSuspender();

		function ComponentWithId() {
			const id = useId();
			return <p>id: {id}</p>;
		}

		const result = [];
		const promise = renderToChunks(
			<div>
				<ComponentWithId />
				<Suspense fallback="loading...">
					<Suspender>
						<ComponentWithId />
					</Suspender>
				</Suspense>
			</div>,
			{ onWrite: (s) => result.push(s) }
		);

		suspended.resolve();
		await promise;

		expect(result).to.deep.equal([
			`<div><p>id: P0-0</p><!--$s?:0--><?start name="0">loading...<?end><!--/$s--></div>`,
			createInitScript(),
			createSubtree('0', '<p>id: P0-1</p>')
		]);
	});

	it('should support using multiple useId hooks inside multiple suspense boundaries', async () => {
		const { Suspender, suspended } = createSuspender();
		const { Suspender: Suspender2, suspended: suspended2 } = createSuspender();

		function ComponentWithId() {
			const id = useId();
			return <p>id: {id}</p>;
		}

		const result = [];
		const promise = renderToChunks(
			<div>
				<ComponentWithId />
				<Suspense fallback="loading...">
					<Suspender>
						<ComponentWithId />
					</Suspender>
				</Suspense>
				<Suspense fallback="loading...">
					<Suspender2>
						<ComponentWithId />
					</Suspender2>
				</Suspense>
			</div>,
			{ onWrite: (s) => result.push(s) }
		);

		suspended.resolve();
		suspended2.resolve();
		await promise;

		expect(result).toEqual([
			`<div><p>id: P0-0</p><!--$s?:0--><?start name="0">loading...<?end><!--/$s--><!--$s?:1--><?start name="1">loading...<?end><!--/$s--></div>`,
			createInitScript(),
			createSubtree('0', '<p>id: P0-1</p>'),
			createSubtree('1', '<p>id: P0-2</p>')
		]);
	});

	it('should inject deferred content before </body></html> for full document rendering', async () => {
		const { Suspender, suspended } = createSuspender();

		const result = [];
		const promise = renderToChunks(
			<html>
				<head>
					<title>Test</title>
				</head>
				<body>
					<Suspense fallback="loading...">
						<Suspender />
					</Suspense>
				</body>
			</html>,
			{ onWrite: (s) => result.push(s) }
		);
		suspended.resolve();
		await promise;

		const fullHtml = result.join('');

		// Deferred init script / templates must appear before </body></html>, not after
		const deferredPos = fullHtml.indexOf(createInitScript());
		const bodyClosePos = fullHtml.indexOf('</body>');
		const htmlClosePos = fullHtml.indexOf('</html>');

		expect(deferredPos).toBeGreaterThan(-1);
		expect(deferredPos).toBeLessThan(bodyClosePos);
		expect(bodyClosePos).toBeLessThan(htmlClosePos);

		// The document must end with </html>
		expect(fullHtml.endsWith('</html>')).toBe(true);
		// No content after </html>
		expect(result[result.length - 1]).toBe('</body></html>');
	});

	it('should prepend <!DOCTYPE html> when rendering a full document with suspended content', async () => {
		const { Suspender, suspended } = createSuspender();

		const result = [];
		const promise = renderToChunks(
			<html>
				<head>
					<title>Test</title>
				</head>
				<body>
					<Suspense fallback="loading...">
						<Suspender />
					</Suspense>
				</body>
			</html>,
			{ onWrite: (s) => result.push(s) }
		);
		suspended.resolve();
		await promise;

		// The first chunk must be prefixed with <!DOCTYPE html>
		expect(result[0].startsWith('<!DOCTYPE html>')).toBe(true);

		// The full output must start with the doctype
		const fullHtml = result.join('');
		expect(fullHtml.startsWith('<!DOCTYPE html>')).toBe(true);

		// The doctype should appear exactly once
		const doctypeCount = (fullHtml.match(/<!DOCTYPE html>/gi) || []).length;
		expect(doctypeCount).toBe(1);
	});

	it('should not prepend <!DOCTYPE html> when rendering a non-document fragment with suspended content', async () => {
		const { Suspender, suspended } = createSuspender();

		const result = [];
		const promise = renderToChunks(
			<div>
				<Suspense fallback="loading...">
					<Suspender />
				</Suspense>
			</div>,
			{ onWrite: (s) => result.push(s) }
		);
		suspended.resolve();
		await promise;

		const fullHtml = result.join('');
		expect(fullHtml.includes('<!DOCTYPE html>')).toBe(false);
	});

	it('should support a component that suspends multiple times', async () => {
		const { Suspender, suspended } = createSuspender();
		const { Suspender: Suspender2, suspended: suspended2 } = createSuspender();

		function MultiSuspender() {
			return (
				<Suspense fallback="loading part 1...">
					<Suspender />
					<Suspender2 />
				</Suspense>
			);
		}

		const result = [];
		const promise = renderToChunks(
			<div>
				<MultiSuspender />
			</div>,
			{ onWrite: (s) => result.push(s) }
		);

		suspended.resolve();
		suspended2.resolve();
		await promise;

		expect(result).to.deep.equal([
			`<div><!--$s?:0--><?start name="0">loading part 1...<?end><!--/$s--></div>`,
			createInitScript(),
			createSubtree('0', '<p>it works</p><p>it works</p>')
		]);
	});

	it('should include the nonce attribute on the init script when a nonce is provided', async () => {
		const { Suspender, suspended } = createSuspender();

		const result = [];
		const promise = renderToChunks(
			<div>
				<Suspense fallback="loading...">
					<Suspender />
				</Suspense>
			</div>,
			{ onWrite: (s) => result.push(s), nonce: 'r4nd0m-nonce' }
		);
		suspended.resolve();
		await promise;

		const fullHtml = result.join('');
		expect(fullHtml).to.contain('<script nonce="r4nd0m-nonce">');

		// The init script should be the only script emitted
		expect(result[1]).to.equal(createInitScript('r4nd0m-nonce'));
	});

	it.each([
		['null', null],
		['false', false],
		['an empty string', ''],
		['an empty array', []]
	])(
		'should replace the fallback when suspended content resolves to %s',
		async (_, children) => {
			const { Suspender, suspended } = createSuspender();
			const result = [];
			const promise = renderToChunks(
				<Suspense fallback="loading...">
					<Suspender>{children}</Suspender>
				</Suspense>,
				{ onWrite: (chunk) => result.push(chunk) }
			);

			suspended.resolve();
			await promise;

			const id = result[0].match(/\$s[?!]:(\w+)/)[1];
			expect(result).toEqual([
				`<!--$s?:${id}--><?start name="${id}">loading...<?end><!--/$s-->`,
				createInitScript(),
				createSubtree(id, '')
			]);
		}
	);

	it('should wait for every suspension in a boundary before patching it', async () => {
		const first = createSuspender();
		const second = createSuspender();
		const result = [];
		const promise = renderToChunks(
			<Suspense fallback="loading...">
				<first.Suspender>
					<p>first</p>
				</first.Suspender>
				<second.Suspender>
					<p>second</p>
				</second.Suspender>
			</Suspense>,
			{ onWrite: (chunk) => result.push(chunk) }
		);

		first.suspended.resolve();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(
			result.filter((chunk) => chunk.startsWith('<template for='))
		).toEqual([]);

		second.suspended.resolve();
		await promise;
		const patches = result.filter((chunk) =>
			chunk.startsWith('<template for=')
		);
		expect(patches).toHaveLength(1);
		expect(patches[0]).toContain('<p>first</p><p>second</p>');
	});

	it('should keep the siblings of a wrapped suspender inside the boundary', async () => {
		const { Suspender, suspended } = createSuspender();
		const Card = ({ children }) => <div class="card">{children}</div>;
		const result = [];
		const promise = renderToChunks(
			<main>
				<Suspense fallback={<i>loading</i>}>
					<h1>header</h1>
					<Card>
						<Suspender />
					</Card>
					<footer>footer</footer>
				</Suspense>
			</main>,
			{ onWrite: (s) => result.push(s) }
		);
		suspended.resolve();
		await promise;

		const id = result[0].match(/\$s\?:(\w+)/)[1];
		expect(result).to.deep.equal([
			`<main><!--$s?:${id}--><?start name="${id}"><i>loading</i><?end><!--/$s--></main>`,
			createInitScript(),
			createSubtree(
				id,
				'<h1>header</h1><div class="card"><p>it works</p></div><footer>footer</footer>'
			)
		]);
	});

	it('should stream a boundary found in discarded content once, inside its parent', async () => {
		const outer = createSuspender();
		const inner = createSuspender();
		const Card = ({ children }) => <div>{children}</div>;
		const result = [];
		const promise = renderToChunks(
			<Suspense fallback="outer">
				<Card>
					<outer.Suspender />
				</Card>
				<Suspense fallback="inner">
					<Card>
						<inner.Suspender>inner</inner.Suspender>
					</Card>
				</Suspense>
			</Suspense>,
			{ onWrite: (s) => result.push(s) }
		);
		outer.suspended.resolve();
		await new Promise((r) => setTimeout(r));
		inner.suspended.resolve();
		await promise;

		const html = result.join('');
		const [outerId, innerId] = [...html.matchAll(/\$s\?:(\w+)/g)].map(
			(m) => m[1]
		);
		expect(result[0]).to.equal(
			`<!--$s?:${outerId}--><?start name="${outerId}">outer<?end><!--/$s-->`
		);
		expect(result.slice(2)).to.deep.equal([
			createSubtree(
				outerId,
				`<div><p>it works</p></div><!--$s?:${innerId}--><?start name="${innerId}">inner<?end><!--/$s-->`
			),
			createSubtree(innerId, '<div>inner</div>')
		]);
	});

	it('should not treat a component that catches suspensions on its instance as a boundary', async () => {
		const { Suspender, suspended } = createSuspender();
		const Route = ({ route }) => route;
		function Router({ children }) {
			this.__c = () => {};
			return <Route route={children[1]} />;
		}
		const result = [];
		const promise = renderToChunks(
			<Suspense fallback="loading">
				<Router>
					<p>a</p>
					<Suspender>b</Suspender>
					<p>c</p>
				</Router>
			</Suspense>,
			{ onWrite: (s) => result.push(s) }
		);
		suspended.resolve();
		await promise;

		const id = result[0].match(/\$s\?:(\w+)/)[1];
		expect(result[2]).to.equal(createSubtree(id, 'b'));
	});

	it('should retry a boundary with its own context', async () => {
		const { Suspender, suspended } = createSuspender();
		const Depth = createContext(0);
		function Nested({ children }) {
			const depth = useContext(Depth) + 1;
			return (
				<Depth.Provider value={depth}>
					<p>depth {depth}</p>
					{children}
				</Depth.Provider>
			);
		}
		const result = [];
		const promise = renderToChunks(
			<Suspense fallback="loading">
				<Nested>
					<Nested>
						<Suspender />
					</Nested>
				</Nested>
			</Suspense>,
			{ onWrite: (s) => result.push(s) }
		);
		suspended.resolve();
		await promise;

		const id = result[0].match(/\$s\?:(\w+)/)[1];
		expect(result[2]).to.equal(
			createSubtree(id, '<p>depth 1</p><p>depth 2</p><p>it works</p>')
		);
	});

	it('should report a boundary that throws after resuming and leave it to the client', async () => {
		const { suspended, getResolved } = createSuspender();
		const error = new Error('render failed');
		function Thrower() {
			if (!getResolved()) throw suspended.promise;
			throw error;
		}

		const result = [];
		const errors = [];
		const promise = renderToChunks(
			<div>
				<Suspense fallback="loading...">
					<Thrower />
				</Suspense>
			</div>,
			{ onWrite: (s) => result.push(s), onError: (e) => errors.push(e) }
		);
		suspended.resolve();
		await promise;

		expect(errors).to.deep.equal([error]);
		const id = /\$s[?!]:(\w+)/.exec(result[0])[1];
		expect(result.slice(2)).to.deep.equal([createClientRenderInstruction(id)]);
	});

	it('should report a rejected suspension and keep streaming its siblings', async () => {
		const failed = new Deferred();
		function Failing() {
			throw failed.promise;
		}
		const working = createSuspender();
		const error = new Error('fetch failed');

		const result = [];
		const errors = [];
		const promise = renderToChunks(
			<div>
				<Suspense fallback="a...">
					<Failing />
				</Suspense>
				<Suspense fallback="b...">
					<working.Suspender />
				</Suspense>
			</div>,
			{ onWrite: (s) => result.push(s), onError: (e) => errors.push(e) }
		);
		failed.reject(error);
		await Promise.resolve();
		working.suspended.resolve();
		await promise;

		const html = result.join('');
		expect(errors).to.deep.equal([error]);
		expect(html).to.contain('a...');
		expect(html).to.match(/<script>.*\$s!:/);
		expect(html).to.match(/<template for="\w+"><p>it works<\/p>/);
		expect(html).not.to.contain('undefined');
	});

	it('should prepend <!DOCTYPE html> when rendering a full document that does not suspend', async () => {
		const result = [];
		await renderToChunks(
			<html>
				<body>
					<p>ready</p>
				</body>
			</html>,
			{ onWrite: (s) => result.push(s) }
		);

		expect(result).to.deep.equal([
			'<!DOCTYPE html><html><body><p>ready</p></body></html>'
		]);
	});
});

describe('createInitScript', () => {
	it('should not include a nonce attribute by default', () => {
		const script = createInitScript();
		expect(script.startsWith('<script>')).to.be.true;
		expect(script).to.not.contain('nonce=');
	});

	it('should include a nonce attribute when a nonce is provided', () => {
		const script = createInitScript('r4nd0m-nonce');
		expect(script.startsWith('<script nonce="r4nd0m-nonce">')).to.be.true;
	});

	it('should encode HTML entities in the nonce', () => {
		const script = createInitScript('a"b&c<d');
		expect(script.startsWith('<script nonce="a&quot;b&amp;c&lt;d">')).to.be
			.true;
	});
});
