import { h } from 'preact';
import { expect } from 'chai';
import { Deferred } from '../src/util';
import { renderToReadableStream } from '../src/stream';

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
	it('should render non-suspended JSX in one go', async () => {
		const stream = renderToReadableStream(<p>hello</p>);
		const state = createSink(stream);
		const result = await state.promise;
		expect(result).to.deep.equal(['<p>hello</p>']);
	});
});
