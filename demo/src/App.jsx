import { h } from 'preact';
import { Suspense, lazy } from 'preact/compat';
import { Client, Provider, cacheExchange, fetchExchange } from '@urql/preact';

const client = new Client({
	url: 'https://trygql.formidable.dev/graphql/basic-pokedex',
	exchanges: [cacheExchange, fetchExchange],
	suspense: true
});

export function App({ head }) {
	const Pokemons = lazy(
		() =>
			new Promise((res) => {
				setTimeout(
					() => {
						res(import('./Pokemons.jsx'));
					},
					typeof document === 'undefined' ? 500 : 3000
				);
			})
	);
	return (
		<html>
			<head dangerouslySetInnerHTML={{ __html: head }} />
			<body>
				<Provider value={client}>
					<main>
						<h1>Our Counter application</h1>
						<Suspense fallback={<p>Loading...</p>}>
							<Pokemons />
						</Suspense>
					</main>
					{import.meta.env.DEV && (
						<script type="module" src="/src/entry-client.jsx" />
					)}
				</Provider>
			</body>
		</html>
	);
}
