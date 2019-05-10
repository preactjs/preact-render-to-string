import prepass from '../prepass';
import { h, lazy, Suspense } from 'preact';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

describe('prepass', () => {
	it('should render suspension', () => {
		function LazyComp() { return <p>Hello Lazy!</p>; }
		const Lazied = lazy(() => Promise.resolve({ default: LazyComp }));

		const toBeRendered = (
			<section>
				<Suspense fallback={<div>Fallback...</div>}>
					<article>
						<Lazied />
					</article>
				</Suspense>
			</section>
		);

		const result = prepass(toBeRendered);

		expect(result.then).not.to.be.undefined;

		return result.then(
			(rendered) => {
				let expected = `<section><article><p>Hello Lazy!</p></article></section>`;

				expect(rendered).to.equal(expected);
			},
			(e) => {
				expect(e).to.eql(undefined);
			}
		);
	});

	it('should return a promise for sync rendering', () => {
		const toBeRendered = (
			<section>
				<p>Hello synchronous render</p>
			</section>
		);

		const result = prepass(toBeRendered);

		expect(result.then).not.to.be.undefined;

		return result.then(
			(rendered) => {
				let expected = `<section><p>Hello synchronous render</p></section>`;

				expect(rendered).to.equal(expected);
			},
			(e) => {
				expect(e).to.eql(undefined);
			}
		);
	});
});
