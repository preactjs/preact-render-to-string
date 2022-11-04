import { useSignal } from '@preact/signals';
import { expect } from 'chai';
import { h } from 'preact';
import { render } from '../src';

describe('signals', () => {
	it('should render text signals', () => {
		function App() {
			const text = useSignal('hello world');
			return <p>{text}</p>;
		}

		expect(render(<App />)).to.equal('<p>hello world</p>');
	});

	it('should render prop signals', () => {
		function App() {
			const className = useSignal('test');
			return <p className={className}>hello world</p>;
		}

		expect(render(<App />)).to.equal('<p class="test">hello world</p>');
	});
});
