import { h, Component, createElement, Fragment } from 'preact';
import { expect, describe, it } from 'vitest';
import { Suspense } from 'preact/compat';
import { useId } from 'preact/hooks';
import { renderToChunks } from '../../src/lib/chunked';
import { createSubtree, createInitScript } from '../../src/lib/client';
import { createSuspender } from '../utils';
import { Deferred } from '../../src/lib/util';
import { VNODE, PARENT } from '../../src/lib/constants';

describe('renderToChunks', () => {
	it('should render non-suspended JSX in one go', async () => {
		const result = [];
		await renderToChunks(<div class="foo">bar</div>, {
			onWrite: (s) => result.push(s)
		});

		expect(result).toEqual(['<div class="foo">bar</div>']);
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
			'<div><!--$s:5-->loading...<!--/$s:5--></div>',
			'<div hidden>',
			createInitScript(),
			createSubtree('5', '<p>it works</p>'),
			'</div>'
		]);
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
			{ onWrite: (s) => result.push(s), abortSignal: controller.signal }
		);

		controller.abort();
		await promise;

		suspended.resolve();

		expect(result).to.deep.equal([
			'<div><!--$s:10-->loading...<!--/$s:10--></div>',
			'<div hidden>',
			createInitScript(),
			'</div>'
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
			'<div><!--$s:16-->loading...<!--/$s:16--></div>',
			'<div hidden>',
			createInitScript(),
			createSubtree('16', '<p>it works</p>'),
			'</div>'
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
			'<div><p>id: P0-0</p><!--$s:24-->loading...<!--/$s:24--></div>',
			'<div hidden>',
			createInitScript(),
			createSubtree('24', '<p>id: P0-1</p>'),
			'</div>'
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
			'<div><p>id: P0-0</p><!--$s:33-->loading...<!--/$s:33--><!--$s:36-->loading...<!--/$s:36--></div>',
			'<div hidden>',
			createInitScript(),
			createSubtree('33', '<p>id: P0-1</p>'),
			createSubtree('36', '<p>id: P0-2</p>'),
			'</div>'
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

		// Deferred wrapper must appear before </body></html>, not after
		const deferredPos = fullHtml.indexOf('<div hidden>');
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
			'<div><!--$s:70-->loading part 1...<!--/$s:70--></div>',
			'<div hidden>',
			createInitScript(),
			createSubtree('70', '<p>it works</p><p>it works</p>'),
			'</div>'
		]);
	});

	it('should forward a rejected suspense promise to onError', async () => {
		const deferred = new Deferred();
		let settled = false;
		deferred.promise.catch(() => (settled = true));
		function Rejecter() {
			if (!settled) throw deferred.promise;
			return <p>unreachable</p>;
		}

		const errors = [];
		const promise = renderToChunks(
			<div>
				<Suspense fallback="loading...">
					<Rejecter />
				</Suspense>
			</div>,
			{ onWrite: () => {}, onError: (e) => errors.push(e) }
		);
		deferred.reject(new Error('upstream failed'));

		await promise;

		expect(errors.map((e) => e.message)).to.deep.equal(['upstream failed']);
	});

	it('should reject the render when a suspense promise rejects and no onError is given', async () => {
		const deferred = new Deferred();
		let settled = false;
		deferred.promise.catch(() => (settled = true));
		function Rejecter() {
			if (!settled) throw deferred.promise;
			return <p>unreachable</p>;
		}

		const promise = renderToChunks(
			<div>
				<Suspense fallback="loading...">
					<Rejecter />
				</Suspense>
			</div>,
			{ onWrite: () => {} }
		);
		deferred.reject(new Error('upstream failed'));

		await expect(promise).rejects.toThrow('upstream failed');
	});

	it('should forward an error thrown while rendering a resumed subtree', async () => {
		const deferred = new Deferred();
		let resumed = false;
		function FailsOnResume() {
			if (!resumed) throw deferred.promise;
			throw new Error('resume failed');
		}

		const errors = [];
		const promise = renderToChunks(
			<div>
				<Suspense fallback="loading...">
					<FailsOnResume />
				</Suspense>
			</div>,
			{ onWrite: () => {}, onError: (e) => errors.push(e) }
		);
		resumed = true;
		deferred.resolve();

		await promise;

		expect(errors.map((e) => e.message)).to.deep.equal(['resume failed']);
	});

	it('should reject when a resumed subtree throws and no onError is given', async () => {
		const deferred = new Deferred();
		let resumed = false;
		function FailsOnResume() {
			if (!resumed) throw deferred.promise;
			throw new Error('resume failed');
		}

		const promise = renderToChunks(
			<div>
				<Suspense fallback="loading...">
					<FailsOnResume />
				</Suspense>
			</div>,
			{ onWrite: () => {} }
		);
		resumed = true;
		deferred.resolve();

		await expect(promise).rejects.toThrow('resume failed');
	});

	it('should find a boundary whose render returns a single keyless Fragment', async () => {
		// preact/compat's Suspense returns an array, so the throw is caught one
		// level below the boundary. An implementation returning a bare Fragment
		// is unwrapped by the renderer, putting the throw in the boundary's own
		// frame -- it must still be found.
		class FragmentSuspense extends Component {
			constructor(props) {
				super(props);
				this.state = { suspended: false };
			}

			__c(promise) {
				this.setState({ suspended: true });
				promise.then(() => this.setState({ suspended: false }));
			}

			render() {
				const { children, fallback } = this.props;
				return createElement(
					Fragment,
					null,
					this.state.suspended ? fallback : children
				);
			}
		}

		const { Suspender, suspended } = createSuspender();

		const result = [];
		const promise = renderToChunks(
			<div>
				<FragmentSuspense fallback="loading...">
					<Suspender />
				</FragmentSuspense>
			</div>,
			{ onWrite: (s) => result.push(s) }
		);
		suspended.resolve();

		await promise;

		expect(result.join('')).to.contain('<p>it works</p>');
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
		expect(result[2]).to.equal(createInitScript('r4nd0m-nonce'));
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
