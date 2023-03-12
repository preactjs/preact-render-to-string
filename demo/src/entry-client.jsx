import { hydrate } from 'preact';
import { LocationProvider } from 'preact-iso';
import { App } from './App';

const config = { attributes: true, childList: true, subtree: true };
const mut = new MutationObserver((mutationList, observer) => {
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

hydrate(
	<LocationProvider>
		<App />
	</LocationProvider>,
	document
);
