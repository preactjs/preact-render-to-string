import renderToNodeStream from '../src/stream';
import { h, Component, lazy } from 'preact';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

describe('stream.render', () => {
	describe('Basic JSX', () => {
		it('should render JSX', () => {
			let stream = renderToNodeStream(<div class="foo">bar</div>),
				expectedParts = ['<div class="foo"','>','bar','</div>'],
				expected = expectedParts.join('');

			return new Promise((resolve, reject) => {
				let chunks = [];
				stream.on('data', (chunk) => {
					chunks.push(chunk);
				});
				stream.on('end', () => {
					const parts = chunks.map(c => c.toString('utf8'));
					const final = Buffer.concat(chunks).toString('utf8');

					expect(final).to.equal(expected);
					expect(parts).to.deep.equal(expectedParts);

					resolve();
				});
				stream.on('error', reject);
			});
		});

		it('should render components', () => {
			function FuncComp(props) {
				return (
					<article>
						<h1>Hello Functional</h1>
						<p>More content</p>
						{props.children}
					</article>
				);
			}

			class ClassComp extends Component {
				render(props) {
					return (
						<article>
							<h1>Hello Class</h1>
							<p>Even more</p>
							{props.children}
						</article>
					);
				}
			}

			let stream = renderToNodeStream(
					<section>
						<FuncComp>
							<p>With children</p>
						</FuncComp>
						<ClassComp>
							<p>Also with children</p>
						</ClassComp>
					</section>
				),
				expectedParts = [
					'<section', '>',
					'<article', '>',
					'<h1', '>',
					'Hello Functional',
					'</h1>',
					'<p', '>',
					'More content',
					'</p>',
					'<p', '>',
					'With children',
					'</p>',
					'</article>',
					'<article', '>',
					'<h1', '>',
					'Hello Class',
					'</h1>',
					'<p', '>',
					'Even more',
					'</p>',
					'<p', '>',
					'Also with children',
					'</p>',
					'</article>',
					'</section>'
				],
				expected = expectedParts.join('');

			return new Promise((resolve, reject) => {
				let chunks = [];
				stream.on('data', (chunk) => {
					chunks.push(chunk);
				});
				stream.on('end', () => {
					const parts = chunks.map(c => c.toString('utf8'));
					const final = Buffer.concat(chunks).toString('utf8');

					expect(parts).to.deep.equal(expectedParts);
					expect(final).to.equal(expected);

					resolve();
				});
				stream.on('error', reject);
			});
		});

		it('should handle backpressure', () => {
			const highWaterMark = 64;
			let stream = renderToNodeStream(
				<section>
					{[...Array(20)].map(() => <div />)}
				</section>,
				undefined,
				{
					readable: {
						highWaterMark
					}
				}
			);

			return new Promise((res, rej) => {
				stream.read();
				setTimeout(() => {
					expect(stream._readableState.length).to.be.lessThan(highWaterMark + 1);
					res();
				}, 100);
				stream.on('error', (e) => {
					console.error('Stream emitted error:', e);
					rej(e);
				});
				stream.on('end', () => {
					rej('Didn\'t expect stream to end as highWaterMark should be reached...');
				});
			});
		});

		it('should support pausing', () => {
			let stream = renderToNodeStream(
				<section>
					{[...Array(20)].map(() => <div />)}
				</section>
			);

			return new Promise((res, rej) => {
				let chunks = [];
				stream.on('error', (e) => {
					console.error('Stream emitted error:', e);
					rej(e);
				});
				stream.on('data', (chunk) => {
					chunks.push(chunk);
					if (chunks.length === 10) {
						stream.pause();
						setTimeout(() => {
							expect(chunks.length).to.equal(10);
							res();
						}, 100);
					}
				});
				stream.on('end', () => {
					rej('Didn\'t expect stream to end, as it should be paused!');
				});
			});
		});

		it.skip('should support suspension', () => {
			const LazyComp1 = () => <div>Hello Lazy!</div>;
			let resolveLoadable1;
			const loadable1 = new Promise((res) => {
				resolveLoadable1 = () => {
					res({ default: LazyComp1 });
				};
			});
			
			const LazyComp2 = () => <div>Hello Lazy!</div>;
			let resolveLoadable2;
			const loadable2 = new Promise((res) => {
				resolveLoadable2 = () => {
					res({ default: LazyComp2 });
				};
			});
			const Lazied1 = lazy(() => loadable1);
			const Lazied2 = lazy(() => loadable2);

			function FuncComp(props) {
				return (
					<article>
						<h1>Hello Functional</h1>
						<p>More content</p>
						{props.children}
					</article>
				);
			}

			class ClassComp extends Component {
				render(props) {
					return (
						<article>
							<h1>Hello Class</h1>
							<Lazied2 />
							<p>Even more</p>
							{props.children}
						</article>
					);
				}
			}

			let stream = renderToNodeStream(
					<section>
						<FuncComp>
							<Lazied1 />
						</FuncComp>
						<ClassComp>
							<p>Also with children</p>
						</ClassComp>
					</section>
				),
				expectedParts = [
					'<section', '>',
					'<article', '>',
					'<h1', '>',
					'Hello Functional',
					'</h1>',
					'<p', '>',
					'More content',
					'</p>',
					'<div', '>',
					'Hello Lazy!',
					'</div>',
					'</article>',
					'<article', '>',
					'<h1', '>',
					'Hello Class',
					'</h1>',
					'<div', '>',
					'Hello Lazy!',
					'</div>',
					'<p', '>',
					'Even more',
					'</p>',
					'<p', '>',
					'Also with children',
					'</p>',
					'</article>',
					'</section>'
				],
				expected = expectedParts.join('');

			return new Promise((res, rej) => {
				let chunks = [];
				stream.on('error', (e) => {
					console.error('Stream emitted error:', e);
					rej(e);
				});
				stream.on('data', (chunk) => {
					chunks.push(chunk);
					if (chunks.length === 12) {
						expect(chunks.map(c => c.toString('utf8'))).to.deep.equal(expectedParts.slice(0,12));
						resolveLoadable1();
					}
					else if (chunks.length === 16) {
						expect(chunks.map(c => c.toString('utf8'))).to.deep.equal(expectedParts.slice(0,16));
						resolveLoadable2();
					}
				});
				stream.on('end', () => {
					const parts = chunks.map(c => c.toString('utf8'));
					const final = Buffer.concat(chunks).toString('utf8');

					expect(parts).to.deep.equal(expectedParts);
					expect(final).to.equal(expected);

					res();
				});
			});
		});
	});
});
