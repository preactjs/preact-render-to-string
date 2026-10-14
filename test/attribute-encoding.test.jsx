import { Writable } from 'node:stream';
import { h } from 'preact';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import {
	renderToString,
	renderToStaticMarkup,
	renderToStringAsync
} from '../src/index.js';
import { renderToReadableStream } from '../src/stream.js';
import { renderToPipeableStream } from '../src/stream-node.js';

function renderReadable(vnode) {
	return new Response(renderToReadableStream(vnode)).text();
}

function renderPipeable(vnode) {
	return new Promise((resolve, reject) => {
		let html = '';
		const sink = new Writable({
			write(chunk, encoding, done) {
				html += chunk;
				done();
			}
		});
		sink.on('finish', () => resolve(html));
		sink.on('error', reject);
		renderToPipeableStream(vnode, { onError: reject }).pipe(sink);
	});
}

describe.each([
	['renderToString', renderToString],
	['renderToStaticMarkup', renderToStaticMarkup],
	['renderToStringAsync', renderToStringAsync],
	['renderToReadableStream', renderReadable],
	['renderToPipeableStream', renderPipeable]
])('%s attribute encoding', (name, render) => {
	it('should encode JSON array attribute values', async () => {
		const props = JSON.parse(String.raw`{"title":["\"><x-probe>&"]}`);
		const html = await render(h('div', props));

		expect(html).to.equal('<div title="&quot;>&lt;x-probe>&amp;"></div>');
		const { document } = new JSDOM(html).window;
		expect(document.querySelector('x-probe')).to.equal(null);
		expect(document.querySelector('div').getAttribute('title')).to.equal(
			'"><x-probe>&'
		);
	});

	it('should encode nested arrays in className and SVG attributes', async () => {
		const value = [['"<>&'], ['tail']];
		expect(await render(h('div', { className: value }))).to.equal(
			'<div class="&quot;&lt;>&amp;,tail"></div>'
		);
		expect(await render(h('svg', { viewBox: value }))).to.equal(
			'<svg viewBox="&quot;&lt;>&amp;,tail"></svg>'
		);
	});

	it('should encode objects after coercing them once', async () => {
		let calls = 0;
		const value = {
			toString() {
				calls++;
				return '"<>&';
			}
		};
		expect(await render(h('div', { title: value }))).to.equal(
			'<div title="&quot;&lt;>&amp;"></div>'
		);
		expect(calls).to.equal(1);
	});
});
