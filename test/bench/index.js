import { h } from 'preact';
import { describe, test, expect, benchmark } from './runner.js';
import renderToString from '../../src/index.js';
import renderToStringFast from '../../src/ropes.js';
import TextApp from './fixtures/text.js';
import StackApp from './fixtures/stack.js';

describe('performance', () => {
	test('text', () => {
		const html = renderToString(h(TextApp));
		const html2 = renderToStringFast(h(TextApp));
		expect(html.length).toEqual(html2.length);
		const before = benchmark('before', () => {
			if (renderToString(h(TextApp)) !== html) throw Error('mismatch');
		});
		const fast = benchmark('faster', () => {
			if (renderToStringFast(h(TextApp)) !== html) throw Error('mismatch');
		});
		expect(fast.hz).toBeGreaterThan(before.hz);
	});

	test('stack', () => {
		const html = renderToString(h(StackApp));
		const html2 = renderToStringFast(h(StackApp));
		expect(html.length).toEqual(html2.length);
		const before = benchmark('before', () => {
			if (renderToString(h(StackApp)) !== html) throw Error('mismatch');
		});
		const fast = benchmark('faster', () => {
			if (renderToStringFast(h(StackApp)) !== html) throw Error('mismatch');
		});
		expect(fast.hz).toBeGreaterThan(before.hz);
	});
});
