/*global globalThis*/
import { h } from 'preact';
import { expect } from 'chai';
import { Suspense } from 'preact/compat';
import { createSubtree, createInitScript } from '../../src/lib/client';
import { renderToReadableStream } from '../../src/stream';
import { Deferred } from '../../src/lib/util';
import { createSuspender } from '../utils';

/**
 * @param {ReadableStream} input
 */
function createSink(input) {
	const decoder = new TextDecoder('utf-8');
	const queuingStrategy = new CountQueuingStrategy({ highWaterMark: 1 });

	const def = new Deferred();
	const result = [];

	const stream = new WritableStream(
		{
			// Implement the sink
			write(chunk) {
				result.push(decoder.decode(chunk));
			},
			close() {
				def.resolve(result);
			},
			abort(err) {
				def.reject(err);
			}
		},
		queuingStrategy
	);

	input.pipeTo(stream);

	return {
		promise: def.promise,
		stream
	};
}

describe('renderToReadableStream', () => {
	before(async () => {
		// attempt to use native web streams in Node 18, otherwise fall back to a polyfill:
		let streams;
		try {
			streams = await import('node:stream/web');
		} catch (e) {
			streams = await import('web-streams-polyfill/ponyfill');
		}
		const { ReadableStream, WritableStream, CountQueuingStrategy } = streams;

		globalThis.ReadableStream = ReadableStream;
		globalThis.WritableStream = WritableStream;
		globalThis.CountQueuingStrategy = CountQueuingStrategy;
	});

	it('should render non-suspended JSX in one go', async () => {
		const stream = await renderToReadableStream(<div class="foo">bar</div>);
		const sink = createSink(stream);
		const result = await sink.promise;

		expect(result).to.deep.equal(['<div class="foo">bar</div>']);
	});

	it('should render fallback + attach loaded subtree on suspend', async () => {
		const { Suspender, suspended } = createSuspender();

		const stream = renderToReadableStream(
			<div>
				<Suspense fallback="loading...">
					<Suspender />
				</Suspense>
			</div>,
			{ onWrite: (s) => result.push(s) }
		);
		const sink = createSink(stream);
		suspended.resolve();

		const result = await sink.promise;

		expect(result).to.deep.equal([
			'<div><!--preact-island:40-->loading...<!--/preact-island:40--></div>',
			'<div hidden>',
			createInitScript(),
			createSubtree('40', '<p>it works</p>'),
			'</div>'
		]);
	});
});
