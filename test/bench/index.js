import { h } from 'preact';
import { describe, test, expect, benchmark } from './runner.js';
import renderToString from '../../src/ropes.js';
import TextApp from './fixtures/text.js';
import StackApp from './fixtures/stack.js';

describe('performance', () => {
	test('text', () => {
		const html = renderToString(h(TextApp));
		print(html.length + '\n\n');
		const { hz } = benchmark('text', () => {
			if (renderToString(h(TextApp)) !== html) {
				throw Error('mismatch');
			}
		});
		expect(hz).toBeGreaterThan(20);
	});

	test('stack', () => {
		const html = renderToString(h(StackApp));
		const { hz } = benchmark('stack', () => {
			if (renderToString(h(StackApp)) !== html) {
				throw Error('mismatch');
			}
		});
		expect(hz).toBeGreaterThan(150);
	});
});
