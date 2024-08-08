import { h } from 'preact';
import Suite from 'benchmarkjs-pretty';
import renderToStringBaseline, {
	renderToStringAsync as renderToStringAsyncBaseline
} from 'baseline-rts';
// import renderToString from '../src/index';
import renderToString, { renderToStringAsync } from '../dist/index.module.js';
import TextApp from './text';
import StackApp from './stack';
import { App as IsomorphicSearchResults } from './isomorphic-ui/search-results/index';
import { App as ColorPicker } from './isomorphic-ui/color-picker';

function suite(name, Root) {
	return new Suite(name)
		.add('baseline', () => renderToStringAsyncBaseline(<Root />))
		.add('current', () => renderToStringAsync(<Root />))
		.run();
}

function asyncSuite(name, Root) {
	return new Suite(name)
		.add('baseline', () => renderToStringBaseline(<Root />))
		.add('current', () => renderToString(<Root />))
		.run();
}

(async () => {
	await suite('Text', TextApp);
	await suite('SearchResults', IsomorphicSearchResults);
	await suite('ColorPicker', ColorPicker);
	await suite('Stack Depth', StackApp);

	const { App: Async } = await import('./async.js');
	await asyncSuite('async', Async);
})();
