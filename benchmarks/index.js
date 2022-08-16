import { h } from 'preact';
import Suite from 'benchmarkjs-pretty';
import renderToStringBaseline from './lib/render-to-string';
// import renderToString from '../src/index';
import renderToString from '../dist/index.mjs';
import TextApp from './text';
// import StackApp from './stack';
import { App as IsomorphicSearchResults } from './isomorphic-ui/search-results/index';
import { App as ColorPicker } from './isomorphic-ui/color-picker';

function suite(name, Root) {
	return new Suite(name)
		.add('baseline', () => renderToStringBaseline(<Root />))
		.add('current', () => renderToString(<Root />))
		.run();
}

(async () => {
	await suite('Text', TextApp);
	await suite('SearchResults', IsomorphicSearchResults);
	await suite('ColorPicker', ColorPicker);
	// TODO: Enable this once we switched away from recursion
	// await suite('Stack Depth', StackApp);
})();
