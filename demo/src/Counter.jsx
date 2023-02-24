import { h } from 'preact';
import { useState } from 'preact/compat';

const Counter = () => {
	const [count, setCount] = useState(0);

	return (
		<div style={{ display: 'flex' }}>
			<button onClick={() => setCount(count - 1)}>-</button>
			<p>Count: {count}</p>
			<button onClick={() => setCount(count + 1)}>+</button>
		</div>
	);
};

export default Counter;
