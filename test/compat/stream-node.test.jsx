import { PassThrough } from 'node:stream';
import { h } from 'preact';
import { expect, describe, it } from 'vitest';
import { Suspense } from 'preact/compat';
import { createSubtree, createInitScript } from '../../src/lib/client';
import { renderToPipeableStream } from '../../src/stream-node';
import { Deferred } from '../../src/lib/util';
import { createSuspender } from '../utils';

function streamToString(stream) {
	const decoder = new TextDecoder();
	const def = new Deferred();
	stream.on('data', (chunk) => {
		chunks.push(decoder.decode(chunk));
	});
	stream.on('error', (err) => def.reject(err));
	stream.on('end', () => def.resolve(chunks));
	const chunks = [];
	return def;
}

/**
 * @param {ReadableStream} input
 */
function createSink() {
	const stream = new PassThrough();
	const def = streamToString(stream);

	return {
		promise: def.promise,
		stream
	};
}

describe('renderToPipeableStream', () => {
	it('should render non-suspended JSX in one go', async () => {
		const sink = createSink();
		const { pipe } = renderToPipeableStream(<div class="foo">bar</div>, {
			onAllReady: () => {
				pipe(sink.stream);
			}
		});
		const result = await sink.promise;

		expect(result).to.deep.equal(['<div class="foo">bar</div>']);
	});

	it('should render fallback + attach loaded subtree on suspend', async () => {
		const { Suspender, suspended } = createSuspender();

		const sink = createSink();
		const { pipe } = renderToPipeableStream(
			<div>
				<Suspense fallback="loading...">
					<Suspender />
				</Suspense>
			</div>,
			{
				onShellReady: () => {
					pipe(sink.stream);
				}
			}
		);
		suspended.resolve();

		const result = await sink.promise;

		expect(result).to.deep.equal([
			'<div><!--preact-island:5-->loading...<!--/preact-island:5--></div>',
			'<div hidden>',
			createInitScript(),
			createSubtree('5', '<p>it works</p>'),
			'</div>'
		]);
	});

	it('should not error if the stream has already been closed', async () => {
		let error;
		const sink = createSink();
		const { pipe, abort } = renderToPipeableStream(<div class="foo">bar</div>, {
			onAllReady: () => {
				pipe(sink.stream);
			},
			onError: (e) => (error = e)
		});
		await sink.promise;
		abort();

		expect(error).to.be.undefined;
	});
});
