import { hydrate } from 'preact';
import { App } from './App';

const config = { attributes: true, childList: true, subtree: true };
const mut = new MutationObserver((mutationList) => {
	for (const mutation of mutationList) {
		if (mutation.type === 'childList') {
			console.log('A child node has been added or removed.', mutation);
		} else if (mutation.type === 'attributes') {
			console.log(
				`The ${mutation.attributeName} attribute was modified.`,
				mutation
			);
		}
	}
});
mut.observe(document, config);

hydrate(<App />, document);
