import render from './';

export default function renderAsync(...args) {
	function doPass() {
		try {
			return Promise.resolve(render(...args));
		}
		catch (e) {
			if (e.then) {
				const cb = () => doPass(...args);
				return e.then(cb, cb);
			}

			return Promise.reject(e);
		}
	}

	return Promise.resolve(doPass());
}
