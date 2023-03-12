import { h } from 'preact';
import { lazy, Router, Route, ErrorBoundary } from 'preact-iso';

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
				<main>
					<h1>Our Counter application</h1>
					<ErrorBoundary>
						<Router fallback={<p>Loading...</p>}>
							<Route component={Counter} path="/" />
						</Router>
					</ErrorBoundary>
				</main>
				{import.meta.env.DEV && (
					<script type="module" src="/src/entry-client.jsx" />
				)}
			</body>
		</html>
	);
}
