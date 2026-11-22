import { h, Component, Fragment, options } from 'preact';
import { expect, describe, it } from 'vitest';
import { Suspense } from 'preact/compat';
import { useId } from 'preact/hooks';
import { renderToChunks } from '../../src/lib/chunked';
import {
	createSubtree,
	createInitScript,
	createClientRenderInstruction
} from '../../src/lib/client';
import { Deferred } from '../../src/lib/util';
import { createSuspender, pendingRange } from '../utils';
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
			`<div>${pendingRange('0', 'loading...')}</div>`,
			createInitScript(),
			createSubtree('0', '<p>it works</p>')
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
			`<div>${pendingRange('0', 'loading...')}</div>`,
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
			`<div>${pendingRange('0', 'loading...')}</div>`,
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
			`<div><p>id: P0-0</p>${pendingRange('0', 'loading...')}</div>`,
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
			`<div><p>id: P0-0</p>${pendingRange('0', 'loading...')}${pendingRange('1', 'loading...')}</div>`,
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

		// Deferred content must appear before </body></html>, not after
		const deferredPos = fullHtml.indexOf('<template for=');
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

	it('should not split a shell on a </body> that is part of the content', async () => {
		const { Suspender, suspended } = createSuspender();

		const result = [];
		const promise = renderToChunks(
			<div>
				<div dangerouslySetInnerHTML={{ __html: 'pre</body>post' }} />
				<Suspense fallback="loading...">
					<Suspender />
				</Suspense>
			</div>,
			{ onWrite: (s) => result.push(s) }
		);
		suspended.resolve();
		await promise;

		expect(result[0]).toContain('pre</body>post');
		expect(result[1]).toBe(createInitScript());
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
			`<div>${pendingRange('0', 'loading part 1...')}</div>`,
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

		expect(result[1]).to.equal(createInitScript('r4nd0m-nonce'));
		expect(result[2]).to.equal(
			createSubtree('0', '<p>it works</p>', 'r4nd0m-nonce')
		);
		// every script carries the nonce
		expect(fullHtml.match(/<script/g)).to.have.length(
			fullHtml.match(/<script[^>]* nonce="r4nd0m-nonce"/g).length
		);
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

			expect(result).toEqual([
				pendingRange('0', 'loading...'),
				createInitScript(),
				createSubtree('0', '')
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
		expect(result.filter((chunk) => chunk.startsWith('<template'))).toEqual([]);

		second.suspended.resolve();
		await promise;
		const patches = result.filter((chunk) => chunk.startsWith('<template'));
		expect(patches).toHaveLength(1);
		expect(patches[0]).toContain('<p>first</p><p>second</p>');
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
		expect(result.slice(2)).to.deep.equal([createClientRenderInstruction('0')]);
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
		expect(html).to.contain(createClientRenderInstruction('0'));
		expect(html).to.contain(createSubtree('1', '<p>it works</p>'));
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

describe('suspense boundary markers', () => {
	const wait = () => new Promise((resolve) => setTimeout(resolve, 0));

	async function render(vnode, opts = {}) {
		const chunks = [];
		const errors = [];
		const done = renderToChunks(vnode, {
			onWrite: (s) => chunks.push(s),
			onError: (e) => errors.push(e),
			...opts
		});
		return { chunks, errors, done };
	}

	it('should mark content that is in the shell and write no init script', async () => {
		const { chunks, done } = await render(
			<div>
				<Suspense fallback="loading...">
					<p>ready</p>
				</Suspense>
			</div>
		);
		await done;

		expect(chunks).to.deep.equal([
			'<div><!--$s=--><p>ready</p><!--/$s--></div>'
		]);
		expect(chunks.join('')).not.to.contain('$PRS');
	});

	it('should mark a pending boundary with its id on both markers', async () => {
		const { Suspender, suspended } = createSuspender();
		const { chunks, done } = await render(
			<Suspense fallback="loading...">
				<Suspender />
			</Suspense>
		);
		suspended.resolve();
		await done;

		expect(chunks[0]).to.equal(
			'<!--$s?0--><?start name="0">loading...<?end><!--/$s?0-->'
		);
		expect(chunks[1]).to.equal(createInitScript());
		expect(chunks[2]).to.equal(
			'<template for="0"><p>it works</p></template><script data-p="0">$PRS()</script>'
		);
		expect(chunks).to.have.length(3);
	});

	it('should leave a boundary that fails in the shell to the client and report it', async () => {
		const error = new Error('render failed');
		function Thrower() {
			throw error;
		}
		const { chunks, errors, done } = await render(
			<div>
				<Suspense fallback="loading...">
					<p>discarded</p>
					<Thrower />
				</Suspense>
			</div>
		);
		await done;

		expect(errors).to.deep.equal([error]);
		expect(chunks).to.deep.equal(['<div><!--$s!-->loading...<!--/$s--></div>']);
	});

	it('should number the boundaries of each response in base 36 from 0', async () => {
		const run = async (count) => {
			const suspenders = Array.from({ length: count }, () => createSuspender());
			const { chunks, done } = await render(
				<div>
					{suspenders.map(({ Suspender }) => (
						<Suspense fallback="...">
							<Suspender />
						</Suspense>
					))}
				</div>
			);
			suspenders.forEach(({ suspended }) => suspended.resolve());
			await done;
			return chunks;
		};

		const first = await run(1);
		const second = await run(1);
		expect(first).to.deep.equal(second);
		expect(first[0]).to.contain('$s?0');

		const many = await run(12);
		const ids = many
			.slice(2)
			.map((chunk) => /^<template for="(\w+)"/.exec(chunk)[1]);
		expect(ids).to.deep.equal(
			Array.from({ length: 12 }, (_, i) => i.toString(36))
		);
		expect(ids[11]).to.equal('b');
		expect(many[0]).to.contain('<!--$s?b-->');
		expect(many[0]).to.contain('<!--/$s?b-->');
	});

	it('should cover all children of the boundary and stream the siblings of the suspender', async () => {
		const { Suspender, suspended } = createSuspender();
		const { chunks, done } = await render(
			<div>
				<Suspense fallback="loading...">
					<p>before</p>
					<Suspender />
					<p>after</p>
				</Suspense>
			</div>
		);
		suspended.resolve();
		await done;

		expect(chunks[0]).not.to.contain('before');
		expect(chunks[0]).not.to.contain('after');
		expect(chunks[2]).to.equal(
			createSubtree('0', '<p>before</p><p>it works</p><p>after</p>')
		);
	});

	it('should inline an inner boundary that resolved before the outer chunk', async () => {
		const inner = createSuspender();
		const outer = createSuspender();
		const { chunks, done } = await render(
			<Suspense fallback="outer...">
				<Suspense fallback="inner...">
					<inner.Suspender>
						<b>inner</b>
					</inner.Suspender>
				</Suspense>
				<outer.Suspender>
					<i>outer</i>
				</outer.Suspender>
			</Suspense>
		);
		// the inner boundary is abandoned, so the outer one is the only range
		expect(chunks).to.deep.equal([
			pendingRange('1', 'outer...'),
			createInitScript()
		]);

		inner.suspended.resolve();
		await wait();
		outer.suspended.resolve();
		await done;

		expect(chunks).to.deep.equal([
			pendingRange('1', 'outer...'),
			createInitScript(),
			createSubtree('1', '<!--$s=--><b>inner</b><!--/$s--><i>outer</i>')
		]);
	});

	it('should write a new range for an inner boundary that is still pending and stream it after the outer chunk', async () => {
		const inner = createSuspender();
		const outer = createSuspender();
		const { chunks, done } = await render(
			<Suspense fallback="outer...">
				<Suspense fallback="inner...">
					<inner.Suspender>
						<b>inner</b>
					</inner.Suspender>
				</Suspense>
				<outer.Suspender>
					<i>outer</i>
				</outer.Suspender>
			</Suspense>
		);

		outer.suspended.resolve();
		await wait();
		expect(chunks).to.deep.equal([
			pendingRange('1', 'outer...'),
			createInitScript(),
			createSubtree('1', `${pendingRange('2', 'inner...')}<i>outer</i>`)
		]);

		inner.suspended.resolve();
		await done;

		expect(chunks).to.have.length(4);
		expect(chunks[3]).to.equal(createSubtree('2', '<b>inner</b>'));
	});

	it('should write one chunk with the same id when a boundary suspends again', async () => {
		const first = createSuspender();
		const second = createSuspender();
		const { chunks, done } = await render(
			<Suspense fallback="loading...">
				<first.Suspender>
					<b>first</b>
				</first.Suspender>
				<second.Suspender>
					<i>second</i>
				</second.Suspender>
			</Suspense>
		);

		first.suspended.resolve();
		await wait();
		expect(chunks).to.have.length(2);
		second.suspended.resolve();
		await done;

		expect(chunks).to.deep.equal([
			pendingRange('0', 'loading...'),
			createInitScript(),
			createSubtree('0', '<b>first</b><i>second</i>')
		]);
	});

	it('should hand a boundary that fails after its fallback was flushed to the client', async () => {
		const { suspended, getResolved } = createSuspender();
		const error = new Error('render failed');
		function Thrower() {
			if (!getResolved()) throw suspended.promise;
			throw error;
		}
		const { chunks, errors, done } = await render(
			<Suspense fallback="loading...">
				<Thrower />
			</Suspense>,
			{ nonce: 'abc' }
		);
		suspended.resolve();
		await done;

		expect(errors).to.deep.equal([error]);
		expect(chunks).to.deep.equal([
			pendingRange('0', 'loading...'),
			createInitScript('abc'),
			'<script data-p="0" data-x nonce="abc">$PRS()</script>'
		]);
	});

	it('should hand every pending boundary to the client and report the reason on abort', async () => {
		const first = createSuspender();
		const second = createSuspender();
		const controller = new AbortController();
		const { chunks, errors, done } = await render(
			<div>
				<Suspense fallback="a...">
					<first.Suspender />
				</Suspense>
				<Suspense fallback="b...">
					<second.Suspender />
				</Suspense>
			</div>,
			{ abortSignal: controller.signal, nonce: 'abc' }
		);
		const reason = new Error('timeout');
		controller.abort(reason);
		await done;
		first.suspended.resolve();
		await wait();

		expect(errors).to.deep.equal([reason, reason]);
		expect(chunks).to.deep.equal([
			`<div>${pendingRange('0', 'a...')}${pendingRange('1', 'b...')}</div>`,
			createInitScript('abc'),
			'<script data-p="0" data-x nonce="abc">$PRS()</script>',
			'<script data-p="1" data-x nonce="abc">$PRS()</script>'
		]);
	});

	it('should put the nonce on the init script, the chunks and the client render scripts', async () => {
		const ok = createSuspender();
		const failing = createSuspender();
		function Thrower() {
			if (!failing.getResolved()) throw failing.suspended.promise;
			throw new Error('failed');
		}
		const { chunks, done } = await render(
			<div>
				<Suspense fallback="a...">
					<ok.Suspender />
				</Suspense>
				<Suspense fallback="b...">
					<Thrower />
				</Suspense>
			</div>,
			{ nonce: 'n"1' }
		);
		ok.suspended.resolve();
		failing.suspended.resolve();
		await done;

		const html = chunks.join('');
		expect(html.match(/<script/g)).to.have.length(3);
		expect(html.match(/<script[^>]* nonce="n&quot;1">/g)).to.have.length(3);
		expect(chunks).to.contain(createInitScript('n"1'));
		expect(chunks).to.contain(createSubtree('0', '<p>it works</p>', 'n"1'));
		expect(chunks).to.contain(createClientRenderInstruction('1', 'n"1'));
	});

	describe('with options.errorBoundaries', () => {
		class Catcher extends Component {
			constructor(props) {
				super(props);
				this.state = { error: null };
			}
			static getDerivedStateFromError(error) {
				return { error };
			}
			render() {
				return this.state.error ? (
					<em>caught {this.state.error.message}</em>
				) : (
					this.props.children
				);
			}
		}

		function renderWithBoundaries(vnode) {
			options.errorBoundaries = true;
			try {
				return render(vnode);
			} finally {
				options.errorBoundaries = false;
			}
		}

		it('should let a suspension pass through an error boundary up to the Suspense', async () => {
			const { Suspender, suspended } = createSuspender();
			const { chunks, errors, done } = await renderWithBoundaries(
				<Suspense fallback="loading...">
					<Catcher>
						<Suspender />
					</Catcher>
				</Suspense>
			);
			suspended.resolve();
			await done;

			expect(errors).to.deep.equal([]);
			expect(chunks).to.deep.equal([
				pendingRange('0', 'loading...'),
				createInitScript(),
				createSubtree('0', '<p>it works</p>')
			]);
		});

		it('should catch a real error in the error boundary before the Suspense', async () => {
			function Thrower() {
				throw new Error('boom');
			}
			const { chunks, errors, done } = await renderWithBoundaries(
				<Suspense fallback="loading...">
					<Catcher>
						<Thrower />
					</Catcher>
				</Suspense>
			);
			await done;

			expect(errors).to.deep.equal([]);
			expect(chunks).to.deep.equal([
				'<!--$s=--><em>caught boom</em><!--/$s-->'
			]);
		});
	});

	it('should fail the shell when something suspends outside a boundary', async () => {
		const { Suspender } = createSuspender();
		const { done } = await render(
			<div>
				<Suspender />
			</div>
		);

		let rejection;
		await done.catch((e) => (rejection = e));
		expect(rejection.message).to.contain('renderToStringAsync');
	});

	it('should write nested resolved boundaries as ranges of their own', async () => {
		const { chunks, done } = await render(
			<Suspense fallback="a">
				<Suspense fallback="b">
					<Fragment>x</Fragment>
				</Suspense>
			</Suspense>
		);
		await done;

		expect(chunks).to.deep.equal(['<!--$s=--><!--$s=-->x<!--/$s--><!--/$s-->']);
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
