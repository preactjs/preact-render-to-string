import { h } from 'preact';
import { expect } from 'chai';
import { Suspense } from 'preact/compat';
import { useId } from 'preact/hooks';
import { renderToChunks } from '../../src/lib/chunked';
import { createSubtree, createInitScript } from '../../src/lib/client';
import { createSuspender } from '../utils';
import { VNODE, PARENT } from '../../src/lib/constants';

describe('renderToChunks', () => {
	it('should render non-suspended JSX in one go', async () => {
		const result = [];
		await renderToChunks(<div class="foo">bar</div>, {
			onWrite: (s) => result.push(s)
		});

		expect(result).to.deep.equal(['<div class="foo">bar</div>']);
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
			'<div><!--preact-island:5-->loading...<!--/preact-island:5--></div>',
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
			'<div><!--preact-island:10-->loading...<!--/preact-island:10--></div>',
			'<div hidden>',
			createInitScript(1),
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
			'<div><!--preact-island:16-->loading...<!--/preact-island:16--></div>',
			'<div hidden>',
			createInitScript(1),
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
			'<div><p>id: P0-0</p><!--preact-island:24-->loading...<!--/preact-island:24--></div>',
			'<div hidden>',
			createInitScript(1),
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

		expect(result).to.deep.equal([
			'<div><p>id: P0-0</p><!--preact-island:33-->loading...<!--/preact-island:33--><!--preact-island:36-->loading...<!--/preact-island:36--></div>',
			'<div hidden>',
			createInitScript(1),
			createSubtree('33', '<p>id: P0-1</p>'),
			createSubtree('36', '<p>id: P0-2</p>'),
			'</div>'
		]);
	});
});
