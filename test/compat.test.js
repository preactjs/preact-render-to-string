import { render } from '../src';
import { createElement, Component } from 'preact/compat';
import { expect } from 'chai';

describe('compat', () => {
	it('should not duplicate class attribute when className is empty', async () => {
		let rendered = render(createElement('div', { className: '' }));
		let expected = `<div class></div>`;

		expect(rendered).to.equal(expected);
	});

	it('should apply defaultProps (func)', () => {
		const Test = (props) => <div {...props} />;
		Test.defaultProps = {
			foo: 'default foo',
			bar: 'default bar'
		};

		expect(render(<Test />), 'defaults').to.equal(
			'<div foo="default foo" bar="default bar"></div>'
		);
		expect(render(<Test bar="b" />), 'partial').to.equal(
			'<div bar="b" foo="default foo"></div>'
		);
		expect(render(<Test foo="a" bar="b" />), 'overridden').to.equal(
			'<div foo="a" bar="b"></div>'
		);
		expect(render(<Test foo={undefined} bar="b" />), 'overridden').to.equal(
			'<div foo="default foo" bar="b"></div>'
		);
	});

	it('should apply defaultProps (class)', () => {
		class Test extends Component {
			render(props) {
				return <div {...props} />;
			}
		}
		Test.defaultProps = {
			foo: 'default foo',
			bar: 'default bar'
		};

		expect(render(<Test />), 'defaults').to.equal(
			'<div foo="default foo" bar="default bar"></div>'
		);
		expect(render(<Test bar="b" />), 'partial').to.equal(
			'<div bar="b" foo="default foo"></div>'
		);
		expect(render(<Test foo="a" bar="b" />), 'overridden').to.equal(
			'<div foo="a" bar="b"></div>'
		);
		expect(render(<Test foo={undefined} bar="b" />), 'overridden').to.equal(
			'<div foo="default foo" bar="b"></div>'
		);
	});
});
