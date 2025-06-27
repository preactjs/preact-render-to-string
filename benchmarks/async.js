import { h } from 'preact';
import { lazy } from 'preact/compat';

function Leaf() {
	return (
		<div>
			<span class="foo" data-testid="stack">
				deep stack
			</span>
		</div>
	);
}

// oxlint-disable-next-line no-new-array
const lazies = new Array(600).fill(600).map(() =>
	lazy(() =>
		Promise.resolve().then(() => ({
			default: (props) => <div>{props.children}</div>
		}))
	)
);
function PassThrough(props) {
	const Lazy = lazies(props.id);
	return <Lazy {...props} />;
}

function recursive(n, m) {
	if (n <= 0) {
		return <Leaf />;
	}
	return <PassThrough id={n * m}>{recursive(n - 1)}</PassThrough>;
}

const content = [];
for (let i = 0; i < 5; i++) {
	content.push(recursive(10, i));
}

export default function App() {
	return <div>{content}</div>;
}
