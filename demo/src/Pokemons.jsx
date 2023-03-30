import { gql, useQuery } from '@urql/preact';
import { h } from 'preact';

const POKEMONS_QUERY = gql`
	query Pokemons($limit: Int!) {
		pokemons(limit: $limit) {
			id
			name
		}
	}
`;

const Counter = () => {
	const [result] = useQuery({
		query: POKEMONS_QUERY,
		variables: { limit: 10 }
	});

	const { data, fetching, error } = result;

	return (
		<div>
			{fetching && <p>Loading...</p>}

			{error && <p>Oh no... {error.message}</p>}

			{data && (
				<ul>
					{data.pokemons.map((pokemon) => (
						<li key={pokemon.id}>{pokemon.name}</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default Counter;
