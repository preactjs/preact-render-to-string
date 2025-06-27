import 'preact/debug';
import render from '../../src/index.js';
import { h } from 'preact';
import { expect, describe, it } from 'vitest';

describe('debug', () => {
	it('should not throw "Objects are not valid as a child" error', () => {
		expect(() => render(<p>{'foo'}</p>)).not.to.throw();
		expect(() => render(<p>{2}</p>)).not.to.throw();
		expect(() => render(<p>{true}</p>)).not.to.throw();
		expect(() => render(<p>{false}</p>)).not.to.throw();
		expect(() => render(<p>{null}</p>)).not.to.throw();
		expect(() => render(<p>{undefined}</p>)).not.to.throw();
	});

	it('should not throw "Objects are not valid as a child" error #2', () => {
		function Str() {
			return ['foo'];
		}
		expect(() => render(<Str />)).not.to.throw();
	});

	it('should not throw "Objects are not valid as a child" error #3', () => {
		expect(() => render(<p>{'foo'}bar</p>)).not.to.throw();
	});
});
