import {
	render,
	shallowRender,
	renderToStaticMarkup,
	renderToString
} from '../src';
import { expect } from 'chai';

describe('render-to-string', () => {
	describe('exports', () => {
		it('exposes render as a named export', () => {
			expect(render).to.be.a('function');
			expect(render).to.equal(renderToString);
		});

		it('exposes renderToString as a named export', () => {
			expect(renderToString).to.be.a('function');
			expect(renderToString).to.equal(renderToString);
		});

		it('exposes renderToStaticMarkup as a named export', () => {
			expect(renderToStaticMarkup).to.be.a('function');
			expect(renderToStaticMarkup).to.equal(renderToStaticMarkup);
		});

		it('exposes shallowRender as a named export', () => {
			expect(shallowRender).to.be.a('function');
		});
	});
});
