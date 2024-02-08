import render from '../../src/index.js';
import { h } from 'preact';
import { Suspense } from 'preact/compat';
import { expect } from 'chai';
import { createSuspender } from '../utils.js';

describe('Async renderToString', () => {
	it('should render JSX after a suspense boundary', async () => {
		const { Suspender, suspended } = createSuspender();

		const promise = render(
			<Suspense fallback={<div>loading...</div>}>
				<Suspender>
					<div class="foo">bar</div>
				</Suspender>
			</Suspense>
		);

		const expected = `<div class="foo">bar</div>`;

		suspended.resolve();

		const rendered = await promise;

		expect(rendered).to.equal(expected);
	});

	it('should render JSX with nested suspense boundary', async () => {
		const {
			Suspender: SuspenderOne,
			suspended: suspendedOne
		} = createSuspender();
		const {
			Suspender: SuspenderTwo,
			suspended: suspendedTwo
		} = createSuspender();

		const promise = render(
			<ul>
				<Suspense fallback={null}>
					<SuspenderOne>
						<li>one</li>
						<SuspenderTwo>
							<li>two</li>
						</SuspenderTwo>
						<li>three</li>
					</SuspenderOne>
				</Suspense>
			</ul>
		);

		const expected = `<ul><li>one</li><li>two</li><li>three</li></ul>`;

		suspendedOne.resolve();
		suspendedTwo.resolve();

		const rendered = await promise;

		expect(rendered).to.equal(expected);
	});
});
