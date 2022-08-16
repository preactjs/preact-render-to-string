import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import colors from './_colors.js';

export function App({ onMount }) {
	const [selectedColorIndex, setSelectedColorIndex] = useState(0);
	const selectedColor = colors[selectedColorIndex];

	useEffect(() => {
		if (onMount) {
			onMount(setSelectedColorIndex);
		}
		if (typeof window !== 'undefined') window.onMount();
	}, []);

	return (
		<div className="colors">
			<h1>Choose your favorite color:</h1>
			<div className="colors">
				{colors.length ? (
					<ul>
						{colors.map((color, i) => (
							<li
								className={
									'color' + (selectedColorIndex === i ? ' selected' : '')
								}
								key={i}
								style={{
									backgroundColor: color.hex
								}}
								onClick={() => setSelectedColorIndex(i)}
							>
								{color.name}
							</li>
						))}
					</ul>
				) : (
					<div>No colors!</div>
				)}
			</div>
			<div>
				You chose:
				<div className="chosen-color">{selectedColor.name}</div>
			</div>
		</div>
	);
}
