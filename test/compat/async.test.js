import { renderToStringAsync } from '../../src/index.js';
import { h } from 'preact';
import { Suspense } from 'preact/compat';
import { expect } from 'chai';
import { createSuspender } from '../utils.js';

describe('Async renderToString', () => {
	it('should render JSX after a suspense boundary', async () => {
		const { Suspender, suspended } = createSuspender();

		const promise = renderToStringAsync(
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

	it('should render JSX with nested suspended components', async () => {
		const {
			Suspender: SuspenderOne,
			suspended: suspendedOne
		} = createSuspender();
		const {
			Suspender: SuspenderTwo,
			suspended: suspendedTwo
		} = createSuspender();

		const promise = renderToStringAsync(
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

	it('should render JSX with nested suspense boundaries', async () => {
		const {
			Suspender: SuspenderOne,
			suspended: suspendedOne
		} = createSuspender();
		const {
			Suspender: SuspenderTwo,
			suspended: suspendedTwo
		} = createSuspender();

		const promise = renderToStringAsync(
			<ul>
				<Suspense fallback={null}>
					<SuspenderOne>
						<li>one</li>
						<Suspense fallback={null}>
							<SuspenderTwo>
								<li>two</li>
							</SuspenderTwo>
						</Suspense>
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

	it('should render JSX with multiple suspended direct children within a single suspense boundary', async () => {
		const {
			Suspender: SuspenderOne,
			suspended: suspendedOne
		} = createSuspender();
		const {
			Suspender: SuspenderTwo,
			suspended: suspendedTwo
		} = createSuspender();
		const {
			Suspender: SuspenderThree,
			suspended: suspendedThree
		} = createSuspender();

		const promise = renderToStringAsync(
			<ul>
				<Suspense fallback={null}>
					<SuspenderOne>
						<li>one</li>
					</SuspenderOne>
					<Suspense fallback={null}>
						<SuspenderTwo>
							<li>two</li>
						</SuspenderTwo>
					</Suspense>
					<SuspenderThree>
						<li>three</li>
					</SuspenderThree>
				</Suspense>
			</ul>
		);

		const expected = `<ul><li>one</li><li>two</li><li>three</li></ul>`;

		suspendedOne.resolve();
		suspendedTwo.resolve();
		suspendedThree.resolve();

		const rendered = await promise;

		expect(rendered).to.equal(expected);
	});

	it('should rethrow error thrown after suspending', async () => {
		const { suspended, getResolved } = createSuspender();

		function Suspender() {
			if (!getResolved()) {
				throw suspended.promise;
			}

			throw new Error('fail');
		}

		const promise = renderToStringAsync(
			<Suspense fallback={<div>loading...</div>}>
				<Suspender />
			</Suspense>
		);

		let msg = '';
		try {
			suspended.resolve();
			await promise;
		} catch (err) {
			msg = err.message;
		}

		expect(msg).to.equal('fail');
	});
});
