import { h } from 'preact';
import Suite from 'benchmarkjs-pretty';
import renderToString from '../src/index';
import TextApp from './text';
import StackApp from './stack';

new Suite('Bench')
	.add('Text', () => {
		return renderToString(<TextApp />);
	})
	.add('Stack Depth', () => {
		return renderToString(<StackApp />);
	})
	.run();
