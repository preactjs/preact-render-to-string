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
			`<div><!--$s:5--><?start name="5">loading...<?end><!--/$s:5--></div>`,
			createInitScript(),
			createSubtree('5', '<p>it works</p>')
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

	it('should end the response and leave pending boundaries to the client on abort', async () => {
		const { Suspender } = createSuspender();
		const errors = [];
		let allReady = false;
		const sink = createSink();
		const { pipe, abort } = renderToPipeableStream(
			<div>
				<Suspense fallback="loading...">
					<Suspender />
				</Suspense>
				<Suspense fallback="loading...">
					<Suspender />
				</Suspense>
			</div>,
			{
				onShellReady: () => pipe(sink.stream),
				onAllReady: () => (allReady = true),
				onError: (e) => errors.push(e)
			}
		);
		await new Promise((r) => setTimeout(r));
		const reason = new Error('timeout');
		abort(reason);
		abort(reason);

		const html = (await sink.promise).join('');
		// Once per boundary that is left to the client
		expect(errors).to.deep.equal([reason, reason]);
		expect(allReady).to.equal(true);
		expect(html).to.contain('loading...');
		expect(html).to.contain('$s!:');
		expect(html.endsWith('</script>')).to.equal(true);
	});

	it('should not call onShellReady when the shell throws', async () => {
		const error = new Error('shell failed');
		function Thrower() {
			throw error;
		}
		const errors = [];
		const shellErrors = [];
		let shellReady = false;
		renderToPipeableStream(<Thrower />, {
			onShellReady: () => (shellReady = true),
			onShellError: (e) => shellErrors.push(e),
			onError: (e) => errors.push(e)
		});
		await new Promise((r) => setTimeout(r));

		expect(shellReady).to.equal(false);
		expect(errors).to.deep.equal([error]);
		expect(shellErrors).to.deep.equal([error]);
	});

	it('should leave a boundary that throws in the shell to the client', async () => {
		const error = new Error('render failed');
		function Thrower() {
			throw error;
		}
		const calls = [];
		const sink = createSink();
		const { pipe } = renderToPipeableStream(
			<div>
				<Suspense fallback="loading...">
					<Thrower />
				</Suspense>
			</div>,
			{
				onShellReady: () => {
					calls.push('shell');
					pipe(sink.stream);
				},
				onAllReady: () => calls.push('all'),
				onError: (e) => calls.push(e)
			}
		);

		const html = (await sink.promise).join('');
		expect(calls).to.deep.equal([error, 'shell', 'all']);
		expect(html).to.match(
			/^<div><!--\$s!:\d+-->loading...<!--\/\$s:\d+--><\/div>$/
		);
	});

	it('should abort the render when the destination closes early', async () => {
		const { Suspender } = createSuspender();
		const errors = [];
		const allReady = new Deferred();
		const sink = createSink();
		const { pipe } = renderToPipeableStream(
			<div>
				<Suspense fallback="loading...">
					<Suspender />
				</Suspense>
			</div>,
			{
				onShellReady: () => pipe(sink.stream),
				onAllReady: allReady.resolve,
				onError: (e) => errors.push(e.message)
			}
		);
		await new Promise((r) => setTimeout(r));
		sink.stream.destroy();

		await allReady.promise;
		expect(errors).to.deep.equal(['The destination stream closed early.']);
	});

	it('should include the nonce attribute on the init script when a nonce is provided', async () => {
		const { Suspender, suspended } = createSuspender();

		const sink = createSink();
		const { pipe } = renderToPipeableStream(
			<div>
				<Suspense fallback="loading...">
					<Suspender />
				</Suspense>
			</div>,
			{
				nonce: 'r4nd0m-nonce',
				onShellReady: () => {
					pipe(sink.stream);
				}
			}
		);
		suspended.resolve();

		const result = await sink.promise;

		expect(result.join('')).to.contain('<script nonce="r4nd0m-nonce">');
		expect(result.join('')).to.not.contain('<script>');
	});

	it('should replace the fallback when suspended content resolves empty', async () => {
		const { Suspender, suspended } = createSuspender();
		const sink = createSink();
		const { pipe } = renderToPipeableStream(
			<Suspense fallback="loading...">
				<Suspender>{null}</Suspender>
			</Suspense>,
			{
				onShellReady: () => pipe(sink.stream)
			}
		);
		suspended.resolve();

		const result = await sink.promise;
		const id = result[0].match(/\$s:(\d+)/)[1];
		expect(result).toEqual([
			`<!--$s:${id}--><?start name="${id}">loading...<?end><!--/$s:${id}-->`,
			createInitScript(),
			createSubtree(id, '')
		]);
	});
});
