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

function syncSuite(name, Root) {
	return new Suite(name)
		.add('baseline', () => renderToStringBaseline(<Root />))
		.add('current', () => renderToString(<Root />))
		.run();
}

function asyncSuite(name, Root) {
	const suite = new Suite(name);
	suite.suite.add(
		'baseline',
		function (deferred) {
			renderToStringAsyncBaseline(<Root />).then(() => deferred.resolve());
		},
		{ defer: true }
	);
	suite.suite.add(
		'current',
		function (deferred) {
			renderToStringAsync(<Root />).then(() => deferred.resolve());
		},
		{ defer: true }
	);
	return suite.run();
}

(async () => {
	await syncSuite('Text', TextApp);
	await syncSuite('SearchResults', IsomorphicSearchResults);
	await syncSuite('ColorPicker', ColorPicker);
	await syncSuite('Stack Depth', StackApp);

	const { default: Async } = await import('./async.js');
	await asyncSuite('async', Async);
})();
