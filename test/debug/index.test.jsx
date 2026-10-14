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

	it('should throw for plain object children rendered by a DOM element', () => {
		expect(() => render(<div>{{ foo: 123 }}</div>)).to.throw(
			/Objects are not valid as a child/
		);
		expect(() => render(<div>{[[{ foo: 123 }]]}</div>)).to.throw(
			/Objects are not valid as a child/
		);

		function ReturnObject() {
			return { foo: 123 };
		}
		expect(() => render(<ReturnObject />)).to.throw(
			/Objects are not valid as a child/
		);
	});

	it('should not reject object children that a component does not render', () => {
		function IgnoreChildren() {
			return <p>ok</p>;
		}
		expect(() => render(<IgnoreChildren>{{ foo: 123 }}</IgnoreChildren>)).not.to
			.throw();
		expect(() => render(<p>{new String('foo')}</p>)).not.to.throw();
	});
});
