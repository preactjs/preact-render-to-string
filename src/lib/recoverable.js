const RECOVERABLE_TYPE = Symbol.for('react.recoverable');

/** @param {any} error */
export function isRecoverable(error) {
	return error != null && error.$$typeof === RECOVERABLE_TYPE;
}
