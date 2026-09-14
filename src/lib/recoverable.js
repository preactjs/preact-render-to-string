const RECOVERABLE_TYPE = Symbol.for('react.recoverable');

/** @param {any} error */
export function isRecoverableError(error) {
	return error != null && error[RECOVERABLE_TYPE] === true;
}
