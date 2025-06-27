if (typeof Symbol !== 'function') {
	let c = 0;
	// oxlint-disable-next-line no-global-assign
	Symbol = function (s) {
		return `@@${s}${++c}`;
	};
	Symbol.for = (s) => `@@${s}`;
}
