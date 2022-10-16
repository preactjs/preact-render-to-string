import { h } from 'preact';
import { expect } from 'chai';
import { Suspense } from 'preact/compat';
import { renderChunked } from '../src/index';
import {
	createCleanupScript,
	createSubtree,
	ISLAND_SCRIPT
} from '../src/client';
import { createSuspender } from './utils';

describe('renderChunked', () => {
	it('should render non-suspended JSX in one go', async () => {
		const result = [];
		await renderChunked(<div class="foo">bar</div>, {
			onWrite: (s) => result.push(s)
		});

		expect(result).to.deep.equal(['<div class="foo">bar</div>']);
	});

	it('should render fallback + attach loaded subtree on suspend', async () => {
		const { Suspender, suspended } = createSuspender();

		const result = [];
		const promise = renderChunked(
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
			'<div><!--preact-island-00-->loading...<!--/preact-island-00--></div>',
			ISLAND_SCRIPT,
			createSubtree('preact-island-00', '<p>it works</p>'),
			createCleanupScript()
		]);
	});

	it('should abort pending suspensions with AbortSignal', async () => {
		const { Suspender, suspended } = createSuspender();

		const controller = new AbortController();
		const result = [];
		const promise = renderChunked(
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
			'<div><!--preact-island-00-->loading...<!--/preact-island-00--></div>',
			ISLAND_SCRIPT,
			createCleanupScript()
		]);
	});
});
