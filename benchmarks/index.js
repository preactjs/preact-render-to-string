import { h } from 'preact';
import Suite from 'benchmarkjs-pretty';
import renderToStringBaseline from './lib/render-to-string';
import renderToString from '../src/index';
import renderToStringGenerator from '../src/gen';
import TextApp from './text';
// import StackApp from './stack';
import { App as IsomorphicSearchResults } from './isomorphic-ui-search-results';

const results = [];

function suite(name, Root) {
	return new Suite(name)
		.add('baseline', () => {
			const str = renderToStringBaseline(<Root />);
			if (results.push(`<body>${str}</body>`) === 10) results.length = 0;
		})
		.add('current', () => {
			const str = renderToString(<Root />);
			if (results.push(`<body>${str}</body>`) === 10) results.length = 0;
		})
		.add('gen', () => {
			const str = [...renderToStringGenerator(<Root />)].join('');
			if (results.push(`<body>${str}</body>`) === 10) results.length = 0;
		})
		.run();
}

(async () => {
	await suite('Text', TextApp);
	await suite('SearchResults', IsomorphicSearchResults);
	// TODO: Enable this once we switched away from recursion
	// await suite('Stack Depth', StackApp);
})();
