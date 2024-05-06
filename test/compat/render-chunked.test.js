import { h } from 'preact';
import { expect } from 'chai';
import { Suspense } from 'preact/compat';
import { renderToChunks } from '../../src/lib/chunked';
import { createSubtree, createInitScript } from '../../src/lib/client';
import { createSuspender } from '../utils';

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
});
