import { renderToStream } from '../../src/index.js';
import { h } from 'preact';
import { Suspense } from 'preact/compat';
import { expect } from 'chai';
import { createSuspender } from '../utils.js';

/**
 * @param {AsyncIterable<string>} iter
 * @returns {Promise<string[]>}
 */
async function drain(iter) {
	const out = [];
	for await (const part of iter) {
		out.push(part);
	}
	return out;
}

describe('renderToStream', () => {
	it('should render JSX after a suspense boundary', async () => {
		const { Suspender, suspended } = createSuspender();

		const promise = drain(
			renderToStream(
				<div>
					<h1>foo</h1>
					<Suspense>
						<Suspender>
							<div class="foo">bar</div>
						</Suspender>
					</Suspense>
					<p>baz</p>
				</div>
			)
		);
		suspended.resolve();
		const rendered = await promise;
		expect(rendered).to.deep.equal([
			'<div><h1>foo</h1><!--p:slot:0--><!--/p:slot:0--><p>baz</p></div>',
			'<div class="foo">bar</div>'
		]);
	});

	it('should stream closing </body></html> last', async () => {
		const { Suspender, suspended } = createSuspender();

		const promise = drain(
			renderToStream(
				<html>
					<body>
						<div>
							<h1>foo</h1>
							<Suspense>
								<Suspender>
									<div class="foo">bar</div>
								</Suspender>
							</Suspense>
							<p>baz</p>
						</div>
					</body>
				</html>
			)
		);
		suspended.resolve();
		const rendered = await promise;
		expect(rendered).to.deep.equal([
			'<html><body><div><h1>foo</h1><!--p:slot:0--><!--/p:slot:0--><p>baz</p></div>',
			'<div class="foo">bar</div>',
			'</body></html>'
		]);
	});

	it.only('should render suspense fallback in placeholder', async () => {
		const { Suspender, suspended } = createSuspender();

		const promise = drain(
			renderToStream(
				<div>
					<h1>foo</h1>
					<Suspense fallback={<p>loading...</p>}>
						<Suspender>
							<div class="foo">bar</div>
						</Suspender>
					</Suspense>
					<p>baz</p>
				</div>
			)
		);
		suspended.resolve();
		const rendered = await promise;
		expect(rendered).to.deep.equal([
			'<div><h1>foo</h1><!--p:slot:0--><!--/p:slot:0--><p>baz</p></div>',
			'<div class="foo">bar</div>'
		]);
	});
});
