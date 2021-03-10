import { h } from 'preact';
import Suite from 'benchmarkjs-pretty';
import { renderToString } from '../src/index';
import TextApp from './text';
// import StackApp from './stack';
import { App as SearchResults } from './isomorphic-ui-search-results';
import { App as SearchResultsCompiled } from './isomorphic-ui-search-results-compiled';

new Suite('Bench')
	// .add('Text', () => {
	// 	return renderToString(<TextApp />);
	// })
	.add('SearchResults', () => {
		return renderToString(<SearchResults />);
	})
	.add('SearchResults compiled', () => {
		return renderToString(<SearchResultsCompiled />);
	})
	// TODO: Enable this once we switched away from recursion
	// .add('Stack Depth', () => {
	// 	return renderToString(<StackApp />);
	// })
	.run();

// console.log(renderToString(<SearchResultsCompiled />));
