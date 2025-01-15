import { renderToStringAsync } from '../../src/index.js';
import { h, Fragment } from 'preact';
import { Suspense, useId, lazy, createContext } from 'preact/compat';
import { expect } from 'chai';
import { createSuspender } from '../utils.jsx';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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

		const expected = `<!--$s--><div class="foo">bar</div><!--/$s-->`;

		suspended.resolve();

		const rendered = await promise;

		expect(rendered).to.equal(expected);
	});

	it('should correctly denote null returns of suspending components', async () => {
		const { Suspender, suspended } = createSuspender();

		const Analytics = () => null;

		const promise = renderToStringAsync(
			<Suspense fallback={<div>loading...</div>}>
				<Suspender>
					<Analytics />
				</Suspender>
				<div class="foo">bar</div>
			</Suspense>
		);

		const expected = `<!--$s--><!--/$s--><div class="foo">bar</div>`;

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

		const expected = `<ul><!--$s--><li>one</li><!--$s--><li>two</li><!--/$s--><li>three</li><!--/$s--></ul>`;

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

		const expected = `<ul><!--$s--><li>one</li><!--$s--><li>two</li><!--/$s--><li>three</li><!--/$s--></ul>`;

		suspendedOne.resolve();
		suspendedTwo.resolve();

		const rendered = await promise;

		expect(rendered).to.equal(expected);
	});

	it('should render JSX with nested suspense boundaries containing multiple suspending components', async () => {
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
		} = createSuspender('three');

		const promise = renderToStringAsync(
			<ul>
				<Suspense fallback={null}>
					<SuspenderOne>
						<li>one</li>
						<Suspense fallback={null}>
							<SuspenderTwo>
								<li>two</li>
							</SuspenderTwo>
							<SuspenderThree>
								<li>three</li>
							</SuspenderThree>
						</Suspense>
						<li>four</li>
					</SuspenderOne>
				</Suspense>
			</ul>
		);

		const expected = `<ul><!--$s--><li>one</li><!--$s--><li>two</li><!--/$s--><!--$s--><li>three</li><!--/$s--><li>four</li><!--/$s--></ul>`;

		suspendedOne.resolve();
		suspendedTwo.resolve();
		await wait(0);
		suspendedThree.resolve();

		const rendered = await promise;

		expect(rendered).to.equal(expected);
	});

	it('should render JSX with deeply nested suspense boundaries', async () => {
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
						<Suspense fallback={null}>
							<SuspenderTwo>
								<li>two</li>
								<Suspense fallback={null}>
									<SuspenderThree>
										<li>three</li>
									</SuspenderThree>
								</Suspense>
							</SuspenderTwo>
						</Suspense>
						<li>four</li>
					</SuspenderOne>
				</Suspense>
			</ul>
		);

		const expected = `<ul><!--$s--><li>one</li><!--$s--><li>two</li><!--$s--><li>three</li><!--/$s--><!--/$s--><li>four</li><!--/$s--></ul>`;

		suspendedOne.resolve();
		suspendedTwo.resolve();
		await wait(0);
		suspendedThree.resolve();

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

		const expected = `<ul><!--$s--><li>one</li><!--/$s--><!--$s--><li>two</li><!--/$s--><!--$s--><li>three</li><!--/$s--></ul>`;

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

	it('should support hooks', async () => {
		const { suspended, getResolved } = createSuspender();

		function Suspender() {
			const id = useId();

			if (!getResolved()) {
				throw suspended.promise;
			}

			return <p>{typeof id === 'string' ? 'ok' : 'fail'}</p>;
		}

		const promise = renderToStringAsync(
			<Suspense fallback={<div>loading...</div>}>
				<Suspender />
			</Suspense>
		);

		suspended.resolve();
		const rendered = await promise;
		expect(rendered).to.equal('<!--$s--><p>ok</p><!--/$s-->');
	});

	it('should work with an in-render suspension', async () => {
		const Context = createContext();

		let c = 0;

		const Fetcher = ({ children }) => {
			c++;
			if (c === 1) {
				throw Promise.resolve();
			}
			return <Fragment>{children}</Fragment>;
		};

		const LazyComponent = lazy(
			async () =>
				function ImportedComponent() {
					return <div>2</div>;
				}
		);

		const LoadableComponent = ({}) => (
			<Suspense fallback={'...loading'}>
				<LazyComponent />
			</Suspense>
		);

		const rendered = await renderToStringAsync(
			<Context.Provider>
				<Fetcher>
					<LoadableComponent />
				</Fetcher>
			</Context.Provider>
		);

		// Before we get to the actual DOM this suspends twice
		expect(rendered).to.equal(
			`<!--$s--><!--$s--><div>2</div><!--/$s--><!--/$s-->`
		);
	});

	describe('dangerouslySetInnerHTML', () => {
		it('should support dangerouslySetInnerHTML', async () => {
			// some invalid HTML to make sure we're being flakey:
			let html = '<a href="foo">asdf</a> some text <ul><li>foo<li>bar</ul>';
			let rendered = await renderToStringAsync(
				<div id="f" dangerouslySetInnerHTML={{ __html: html }} />
			);
			expect(rendered).to.equal(`<div id="f">${html}</div>`);
		});

		it('should accept undefined dangerouslySetInnerHTML', async () => {
			const Test = () => (
				<Fragment>
					<div>hi</div>
					<div dangerouslySetInnerHTML={undefined} />
				</Fragment>
			);

			const rendered = await renderToStringAsync(<Test />);
			expect(rendered).to.equal('<div>hi</div><div></div>');
		});

		it('should accept null __html', async () => {
			const Test = () => (
				<Fragment>
					<div>hi</div>
					<div dangerouslySetInnerHTML={{ __html: null }} />
				</Fragment>
			);
			const rendered = await renderToStringAsync(<Test />);
			expect(rendered).to.equal('<div>hi</div><div></div>');
		});

		it('should override children', async () => {
			let rendered = await renderToStringAsync(
				<div dangerouslySetInnerHTML={{ __html: 'foo' }}>
					<b>bar</b>
				</div>
			);
			expect(rendered).to.equal('<div>foo</div>');
		});
	});
});
