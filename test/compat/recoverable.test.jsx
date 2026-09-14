import { h, Fragment, options } from 'preact';
import { Suspense } from 'preact/compat';
import { describe, it, expect } from 'vitest';
import { renderToString, renderToStringAsync } from '../../src/index.js';
import { renderToChunks } from '../../src/lib/chunked.js';
import { createClientRenderInstruction } from '../../src/lib/client.js';
import { Deferred } from '../../src/lib/util.js';
import { renderToReadableStream } from '../../src/stream.js';
import { renderToPipeableStream } from '../../src/stream-node.js';
import { Writable } from 'node:stream';

const RECOVERABLE = Symbol.for('react.recoverable');
function bailout() {
	return Object.freeze({ $$typeof: RECOVERABLE, _reason: 'defer rendering' });
}

function BrowserOnly() {
	throw bailout();
}
function afterPromise(promise, Child = BrowserOnly) {
	let ready = false;
	promise.then(() => {
		ready = true;
	});
	return function Pending() {
		if (!ready) throw promise;
		return <Child />;
	};
}
function boundary(child) {
	return <Suspense fallback={<i>fallback</i>}>{child}</Suspense>;
}

describe('recoverable errors', () => {
	for (const [name, render] of [
		['sync', renderToString],
		['async', renderToStringAsync]
	]) {
		it(`${name}: renders a client-only fallback and discards partial children`, async () => {
			const html = await render(
				<main>
					{boundary(
						<Fragment>
							<b>discard</b>
							<BrowserOnly />
						</Fragment>
					)}
					<b>keep</b>
				</main>
			);
			expect(html).to.equal(
				'<main><!--$s!--><i>fallback</i><!--/$s--><b>keep</b></main>'
			);
		});
		it(`${name}: rejects a recoverable outside Suspense`, async () => {
			await expect(
				Promise.resolve().then(() => render(<BrowserOnly />))
			).rejects.to.have.property('$$typeof', RECOVERABLE);
		});
		it(`${name}: lets a fallback bailout reach an outer boundary`, async () => {
			const html = await render(
				boundary(
					<Suspense fallback={<BrowserOnly />}>
						<BrowserOnly />
					</Suspense>
				)
			);
			expect(html).to.equal('<!--$s!--><i>fallback</i><!--/$s-->');
		});
	}

	it('recovers after a Promise resolves without waiting for a pending sibling', async () => {
		const deferred = new Deferred();
		const Pending = afterPromise(deferred.promise);
		function Never() {
			throw new Promise(() => {});
		}
		function NeverParent() {
			return <Never />;
		}
		function PendingParent() {
			return <Pending />;
		}
		const result = renderToStringAsync(
			boundary(
				<Fragment>
					<NeverParent />
					<PendingParent />
				</Fragment>
			)
		);
		deferred.resolve();
		expect(await result).to.equal('<!--$s!--><i>fallback</i><!--/$s-->');
		expect(options.__s).not.to.equal(true);
	});

	it('waits for an async fallback and keeps its client-only marker', async () => {
		const deferred = new Deferred();
		const Fallback = afterPromise(deferred.promise, () => <i>ready</i>);
		const result = renderToStringAsync(
			<Suspense fallback={<Fallback />}>
				<BrowserOnly />
			</Suspense>
		);
		deferred.resolve();
		expect(await result).to.equal(
			'<!--$s!--><!--$s--><i>ready</i><!--/$s--><!--/$s-->'
		);
	});

	it('does not treat an ordinary Error as a bailout', async () => {
		const error = new Error('failure');
		function Fail() {
			throw error;
		}
		await expect(renderToStringAsync(boundary(<Fail />))).rejects.to.equal(
			error
		);
	});

	it('lets an async fallback error reach an outer boundary', async () => {
		const deferred = new Deferred();
		const Fallback = afterPromise(deferred.promise);
		const result = renderToStringAsync(
			boundary(
				<Suspense fallback={<Fallback />}>
					<BrowserOnly />
				</Suspense>
			)
		);
		deferred.resolve();
		expect(await result).to.equal('<!--$s!--><i>fallback</i><!--/$s-->');
	});

	it('streams an immediate bailout without a pending replacement', async () => {
		const chunks = [];
		await renderToChunks(
			boundary(
				<Fragment>
					<b>discard</b>
					<BrowserOnly />
				</Fragment>
			),
			{ onWrite: (s) => chunks.push(s) }
		);
		expect(chunks).to.have.length(1);
		expect(chunks[0]).to.match(
			/^<!--\$s!:\d+--><i>fallback<\/i><!--\/\$s:\d+-->$/
		);
	});

	it('marks an already-flushed fallback and completes abandoned sibling work', async () => {
		const deferred = new Deferred();
		const Pending = afterPromise(deferred.promise);
		function Never() {
			throw new Promise(() => {});
		}
		function NeverParent() {
			return <Never />;
		}
		function PendingParent() {
			return <Pending />;
		}
		const chunks = [];
		const result = renderToChunks(
			boundary(
				<Fragment>
					<NeverParent />
					<PendingParent />
				</Fragment>
			),
			{ nonce: 'nonce', onWrite: (s) => chunks.push(s) }
		);
		const id = chunks[0].match(/\$s:(\d+)/)[1];
		deferred.resolve();
		await result;
		expect(chunks).to.contain(createClientRenderInstruction(id, 'nonce'));
		expect(chunks.join('')).not.to.contain('<preact-island');
		expect(chunks.join('')).not.to.contain('undefined');
	});

	it('removes abort listeners when pending work is abandoned', async () => {
		const deferred = new Deferred();
		const Pending = afterPromise(deferred.promise);
		const listeners = new Set();
		const abortSignal = {
			aborted: false,
			addEventListener(type, listener) {
				if (type == 'abort') listeners.add(listener);
			},
			removeEventListener(type, listener) {
				if (type == 'abort') listeners.delete(listener);
			}
		};
		const result = renderToChunks(boundary(<Pending />), {
			abortSignal,
			onWrite() {}
		});
		expect(listeners.size).to.equal(1);
		deferred.resolve();
		await result;
		expect(listeners.size).to.equal(0);
	});

	it('releases remaining pending work when streaming fails', async () => {
		const deferred = new Deferred();
		const never = new Promise(() => {});
		const listeners = new Set();
		const abortSignal = {
			aborted: false,
			addEventListener(type, listener) {
				if (type == 'abort') listeners.add(listener);
			},
			removeEventListener(type, listener) {
				if (type == 'abort') listeners.delete(listener);
			}
		};
		function Never() {
			throw never;
		}
		function Fail() {
			throw deferred.promise;
		}
		function NeverParent() {
			return <Never />;
		}
		function FailParent() {
			return <Fail />;
		}
		const result = renderToChunks(
			boundary(
				<Fragment>
					<NeverParent />
					<FailParent />
				</Fragment>
			),
			{ abortSignal, onWrite() {} }
		);
		expect(listeners.size).to.equal(2);
		const error = new Error('failure');
		deferred.reject(error);
		await expect(result).rejects.to.equal(error);
		expect(listeners.size).to.equal(0);
	});

	for (const outcome of ['resolve', 'reject']) {
		it(`ignores abandoned descendant ${outcome} after the stream completes`, async () => {
			const first = new Deferred(),
				second = new Deferred();
			const Bail = afterPromise(first.promise);
			let abandonedRenders = 0;
			function BailParent() {
				return <Bail />;
			}
			function AbandonedParent() {
				return <Abandoned />;
			}
			function Abandoned() {
				abandonedRenders++;
				throw second.promise;
			}
			const chunks = [];
			const result = renderToChunks(
				boundary(
					<Fragment>
						<BailParent />
						<AbandonedParent />
					</Fragment>
				),
				{ onWrite: (s) => chunks.push(s) }
			);
			expect(abandonedRenders).toBe(1);
			first.resolve();
			await result;
			const completed = chunks.slice();
			second[outcome](new Error('abandoned'));
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(abandonedRenders).toBe(1);
			expect(chunks).to.deep.equal(completed);
			expect(chunks.join('')).not.to.contain('<preact-island');
		});
	}

	it('keeps unrelated streaming boundaries alive', async () => {
		const first = new Deferred(),
			second = new Deferred();
		const Bail = afterPromise(first.promise);
		const Ready = afterPromise(second.promise, () => <b>ready</b>);
		const chunks = [];
		const result = renderToChunks(
			<main>
				{boundary(<Bail />)}
				{boundary(<Ready />)}
			</main>,
			{ onWrite: (s) => chunks.push(s) }
		);
		first.resolve();
		second.resolve();
		await result;
		expect(chunks.join('')).to.contain('<b>ready</b></preact-island>');
		expect(chunks.filter((s) => s.startsWith('<preact-island'))).to.have.length(
			1
		);
	});

	it('abandons only the nested streaming boundary that bails out late', async () => {
		const deferred = new Deferred();
		const Bail = afterPromise(deferred.promise);
		const chunks = [];
		const result = renderToChunks(
			boundary(
				<main>
					{boundary(<Bail />)}
					<b>keep</b>
				</main>
			),
			{ onWrite: (s) => chunks.push(s) }
		);
		deferred.resolve();
		await result;
		const html = chunks.join('');
		expect(html).to.contain('<b>keep</b>');
		expect(html).to.contain('<script');
		expect(html).not.to.contain('<preact-island');
	});

	it('rejects a fatal error from a streaming retry', async () => {
		const deferred = new Deferred();
		const error = new Error('failure');
		const Fail = afterPromise(deferred.promise, () => {
			throw error;
		});
		const result = renderToChunks(boundary(<Fail />), { onWrite() {} });
		deferred.resolve();
		await expect(result).rejects.to.equal(error);
	});

	it('rejects a streaming bailout with no boundary', async () => {
		await expect(
			renderToChunks(<BrowserOnly />, { onWrite() {} })
		).rejects.to.have.property('$$typeof', RECOVERABLE);
	});

	it('completes a readable stream and allReady after bailout', async () => {
		const stream = renderToReadableStream(boundary(<BrowserOnly />));
		const reader = stream.getReader();
		const first = await reader.read();
		expect(new TextDecoder().decode(first.value)).to.contain('<!--$s!:');
		expect((await reader.read()).done).to.equal(true);
		await stream.allReady;
	});

	it('completes a pipeable stream without reporting the bailout as an error', async () => {
		const errors = [],
			chunks = [];
		await new Promise((resolve, reject) => {
			const writable = new Writable({
				write(chunk, encoding, next) {
					chunks.push(chunk.toString());
					next();
				}
			});
			writable.on('finish', resolve).on('error', reject);
			renderToPipeableStream(boundary(<BrowserOnly />), {
				onError: (e) => errors.push(e)
			}).pipe(writable);
		});
		expect(errors).to.deep.equal([]);
		expect(chunks.join('')).to.contain('<!--$s!:');
	});
});
