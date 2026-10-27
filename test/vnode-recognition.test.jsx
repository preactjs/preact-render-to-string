import { h, cloneElement, Fragment, isValidElement } from 'preact';
import { jsx, jsxs, jsxDEV, jsxEscape, jsxTemplate } from 'preact/jsx-runtime';
import { renderToString, renderToStringAsync } from '../src/index.js';
import renderToStringPretty from '../src/pretty.js';
import { renderToReadableStream } from '../src/stream.js';
import { renderToPipeableStream } from '../src/stream-node.js';
import { PassThrough } from 'node:stream';
import { describe, it, expect } from 'vitest';

async function renderNodeStream(vnode) {
	const destination = new PassThrough();
	const result = renderToPipeableStream(vnode, {});
	result.pipe(destination);
	let html = '';
	for await (const chunk of destination) html += chunk;
	return html;
}

for (const [name, render] of [
	['sync', renderToString],
	['async', renderToStringAsync],
	['pretty', (vnode) => renderToStringPretty(vnode, {}, { pretty: false })],
	[
		'stream',
		async (vnode) => new Response(renderToReadableStream(vnode)).text()
	],
	['node stream', renderNodeStream]
]) {
	describe(name + ' VNode recognition', () => {
		it('should render VNodes from every factory', async () => {
			const vnode = h(
				Fragment,
				null,
				h('span', null, 'a'),
				cloneElement(h('span', null, 'b')),
				jsx('span', { children: 'c' }),
				jsxs('span', { children: ['d'] }),
				jsxDEV('span', { children: 'e' })
			);
			expect(await render(vnode)).to.equal(
				'<span>a</span><span>b</span><span>c</span><span>d</span><span>e</span>'
			);
		});

		it('should ignore objects not recognized by Preact', async () => {
			const child = structuredClone({
				type: 'span',
				props: { children: 'ignored' }
			});
			expect(isValidElement(child)).to.equal(false);
			expect(
				await render(h('div', null, child, h('span', null, 'child')))
			).to.equal('<div><span>child</span></div>');
		});

		it('should use the active Preact marker', async () => {
			const child = structuredClone({
				constructor: undefined,
				type: 'span',
				props: { children: 'child' }
			});
			const expected = isValidElement(child)
				? '<div><span>child</span></div>'
				: '<div></div>';
			expect(await render(h('div', null, child))).to.equal(expected);
		});
	});
}

describe('precompiled JSX VNode recognition', () => {
	for (const render of [renderToString, renderToStringAsync]) {
		it('should render VNodes and arrays in template expressions', async () => {
			const vnode = jsxTemplate(
				['<div>', '</div>'],
				jsxEscape([h('span', null, 'a'), h('span', null, 'b')])
			);
			expect(await render(vnode)).to.equal(
				'<div><span>a</span><span>b</span></div>'
			);
		});
	}
});
