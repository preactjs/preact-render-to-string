/*global globalThis*/
import { h } from 'preact';
import { expect, beforeAll, describe, it } from 'vitest';
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

	// The sink reports failures through abort() -> def.reject(); swallow the
	// pipeTo rejection so an errored stream is not also an unhandled rejection.
	input.pipeTo(stream).catch(() => {});

	return {
		promise: def.promise,
		stream
	};
}

describe('renderToReadableStream', () => {
	beforeAll(async () => {
		// attempt to use native web streams in Node 18, otherwise fall back to a polyfill:
		let streams;
		try {
			streams = await import('node:stream/web');
		} catch {
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
			undefined,
			{ onWrite: (s) => result.push(s) }
		);
		const sink = createSink(stream);
		suspended.resolve();

		const result = await sink.promise;

		expect(result).toEqual([
			'<div><!--$s:5-->loading...<!--/$s:5--></div>',
			'<div hidden>',
			createInitScript(),
			createSubtree('5', '<p>it works</p>'),
			'</div>'
		]);
	});

	it('should include the nonce attribute on the init script when a nonce is provided', async () => {
		const { Suspender, suspended } = createSuspender();

		const stream = await renderToReadableStream(
			<div>
				<Suspense fallback="loading...">
					<Suspender />
				</Suspense>
			</div>,
			{ nonce: 'r4nd0m-nonce' }
		);
		const sink = createSink(stream);
		suspended.resolve();

		const result = await sink.promise;

		expect(result.join('')).to.contain('<script nonce="r4nd0m-nonce">');
		expect(result.join('')).to.not.contain('<script>');
	});

	it('should error the stream when a suspense promise rejects', async () => {
		const deferred = new Deferred();
		let settled = false;
		deferred.promise.catch(() => (settled = true));
		function Rejecter() {
			if (!settled) throw deferred.promise;
			return <p>unreachable</p>;
		}

		const stream = renderToReadableStream(
			<div>
				<Suspense fallback="loading...">
					<Rejecter />
				</Suspense>
			</div>
		);
		const sink = createSink(stream);
		// Attach before rejecting: allReady settles synchronously with onError.
		const allReady = stream.allReady.catch((e) => e);
		deferred.reject(new Error('upstream failed'));

		await expect(sink.promise).rejects.toThrow('upstream failed');
		expect((await allReady).message).to.equal('upstream failed');
	});
});
