import { h } from 'preact';
import { Suspense, lazy } from 'preact/compat';

export function App({ head }) {
	const Counter = lazy(
		() =>
			new Promise((res) => {
				setTimeout(() => {
					res(import('./Counter.jsx'));
				}, 3000);
			})
	);
	return (
		<html>
			<head dangerouslySetInnerHTML={{ __html: head }} />
			<body>
				<div>Hello world</div>
				<Suspense fallback={<p>Loading...</p>}>
					<Counter />
				</Suspense>
				{import.meta.env.DEV && (
					<script type="module" src="/src/entry-client.jsx" />
				)}
			</body>
		</html>
	);
}
