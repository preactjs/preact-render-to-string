/* eslint-disable */
// preact-render-to-string@5.1.21
import { options as e, Fragment as t } from 'preact';
var r = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|^--/i,
	n = /[&<>"]/;
function o(e) {
	var t = String(e);
	return n.test(t)
		? t
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
		: t;
}
var a = function (e, t) {
		return String(e).replace(/(\n+)/g, '$1' + (t || '\t'));
	},
	i = function (e, t, r) {
		return (
			String(e).length > (t || 40) ||
			(!r && -1 !== String(e).indexOf('\n')) ||
			-1 !== String(e).indexOf('<')
		);
	},
	l = {};
function s(e) {
	var t = '';
	for (var n in e) {
		var o = e[n];
		null != o &&
			'' !== o &&
			(t && (t += ' '),
			(t +=
				'-' == n[0]
					? n
					: l[n] || (l[n] = n.replace(/([A-Z])/g, '-$1').toLowerCase())),
			(t += ': '),
			(t += o),
			'number' == typeof o && !1 === r.test(n) && (t += 'px'),
			(t += ';'));
	}
	return t || void 0;
}
function f(e, t) {
	for (var r in t) e[r] = t[r];
	return e;
}
function u(e, t) {
	return (
		Array.isArray(t) ? t.reduce(u, e) : null != t && !1 !== t && e.push(t), e
	);
}
var c = { shallow: !0 },
	p = [],
	_ = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/,
	d = /[\s\n\\/='"\0<>]/;
function v() {
	this.__d = !0;
}
m.render = m;
var g = function (e, t) {
		return m(e, t, c);
	},
	h = [];
function m(t, r, n) {
	(r = r || {}), (n = n || {});
	var o = e.__s;
	e.__s = !0;
	var a = x(t, r, n);
	return e.__c && e.__c(t, h), (h.length = 0), (e.__s = o), a;
}
function x(r, n, l, c, g, h) {
	if (null == r || 'boolean' == typeof r) return '';
	if ('object' != typeof r) return o(r);
	var m = l.pretty,
		y = m && 'string' == typeof m ? m : '\t';
	if (Array.isArray(r)) {
		for (var b = '', S = 0; S < r.length; S++)
			m && S > 0 && (b += '\n'), (b += x(r[S], n, l, c, g, h));
		return b;
	}
	var w,
		k = r.type,
		O = r.props,
		C = !1;
	if ('function' == typeof k) {
		if (((C = !0), !l.shallow || (!c && !1 !== l.renderRootComponent))) {
			if (k === t) {
				var A = [];
				return (
					u(A, r.props.children), x(A, n, l, !1 !== l.shallowHighOrder, g, h)
				);
			}
			var H,
				j = (r.__c = {
					__v: r,
					context: n,
					props: r.props,
					setState: v,
					forceUpdate: v,
					__d: !0,
					__h: []
				});
			e.__b && e.__b(r);
			var F = e.__r;
			if (k.prototype && 'function' == typeof k.prototype.render) {
				var M = k.contextType,
					T = M && n[M.__c],
					$ = null != M ? (T ? T.props.value : M.__) : n;
				((j = r.__c = new k(O, $)).__v = r),
					(j._dirty = j.__d = !0),
					(j.props = O),
					null == j.state && (j.state = {}),
					null == j._nextState &&
						null == j.__s &&
						(j._nextState = j.__s = j.state),
					(j.context = $),
					k.getDerivedStateFromProps
						? (j.state = f(
								f({}, j.state),
								k.getDerivedStateFromProps(j.props, j.state)
						  ))
						: j.componentWillMount &&
						  (j.componentWillMount(),
						  (j.state =
								j._nextState !== j.state
									? j._nextState
									: j.__s !== j.state
									? j.__s
									: j.state)),
					F && F(r),
					(H = j.render(j.props, j.state, j.context));
			} else
				for (
					var L = k.contextType,
						E = L && n[L.__c],
						D = null != L ? (E ? E.props.value : L.__) : n,
						N = 0;
					j.__d && N++ < 25;

				)
					(j.__d = !1), F && F(r), (H = k.call(r.__c, O, D));
			return (
				j.getChildContext && (n = f(f({}, n), j.getChildContext())),
				e.diffed && e.diffed(r),
				x(H, n, l, !1 !== l.shallowHighOrder, g, h)
			);
		}
		k =
			(w = k).displayName ||
			(w !== Function && w.name) ||
			(function (e) {
				var t = (Function.prototype.toString
					.call(e)
					.match(/^\s*function\s+([^( ]+)/) || '')[1];
				if (!t) {
					for (var r = -1, n = p.length; n--; )
						if (p[n] === e) {
							r = n;
							break;
						}
					r < 0 && (r = p.push(e) - 1), (t = 'UnnamedComponent' + r);
				}
				return t;
			})(w);
	}
	var P,
		R,
		U = '<' + k;
	if (O) {
		var W = Object.keys(O);
		l && !0 === l.sortAttributes && W.sort();
		for (var q = 0; q < W.length; q++) {
			var z = W[q],
				I = O[z];
			if ('children' !== z) {
				if (
					!d.test(z) &&
					((l && l.allAttributes) ||
						('key' !== z && 'ref' !== z && '__self' !== z && '__source' !== z))
				) {
					if ('defaultValue' === z) z = 'value';
					else if ('className' === z) {
						if (void 0 !== O.class) continue;
						z = 'class';
					} else
						g &&
							z.match(/^xlink:?./) &&
							(z = z.toLowerCase().replace(/^xlink:?/, 'xlink:'));
					if ('htmlFor' === z) {
						if (O.for) continue;
						z = 'for';
					}
					'style' === z && I && 'object' == typeof I && (I = s(I)),
						'a' === z[0] &&
							'r' === z[1] &&
							'boolean' == typeof I &&
							(I = String(I));
					var V = l.attributeHook && l.attributeHook(z, I, n, l, C);
					if (V || '' === V) U += V;
					else if ('dangerouslySetInnerHTML' === z) R = I && I.__html;
					else if ('textarea' === k && 'value' === z) P = I;
					else if ((I || 0 === I || '' === I) && 'function' != typeof I) {
						if (!((!0 !== I && '' !== I) || ((I = z), l && l.xml))) {
							U += ' ' + z;
							continue;
						}
						if ('value' === z) {
							if ('select' === k) {
								h = I;
								continue;
							}
							'option' === k &&
								h == I &&
								void 0 === O.selected &&
								(U += ' selected');
						}
						U += ' ' + z + '="' + o(I) + '"';
					}
				}
			} else P = I;
		}
	}
	if (m) {
		var Z = U.replace(/\n\s*/, ' ');
		Z === U || ~Z.indexOf('\n')
			? m && ~U.indexOf('\n') && (U += '\n')
			: (U = Z);
	}
	if (((U += '>'), d.test(k)))
		throw new Error(k + ' is not a valid HTML tag name in ' + U);
	var B,
		G = _.test(k) || (l.voidElements && l.voidElements.test(k)),
		J = [];
	if (R) m && i(R) && (R = '\n' + y + a(R, y)), (U += R);
	else if (null != P && u((B = []), P).length) {
		for (var K = m && ~U.indexOf('\n'), Q = !1, X = 0; X < B.length; X++) {
			var Y = B[X];
			if (null != Y && !1 !== Y) {
				var ee = x(Y, n, l, !0, 'svg' === k || ('foreignObject' !== k && g), h);
				if ((m && !K && i(ee) && (K = !0), ee))
					if (m) {
						var te = ee.length > 0 && '<' != ee[0];
						Q && te ? (J[J.length - 1] += ee) : J.push(ee), (Q = te);
					} else J.push(ee);
			}
		}
		if (m && K) for (var re = J.length; re--; ) J[re] = '\n' + y + a(J[re], y);
	}
	if (J.length || R) U += J.join('');
	else if (l && l.xml) return U.substring(0, U.length - 1) + ' />';
	return (
		!G || B || R
			? (m && ~U.indexOf('\n') && (U += '\n'), (U += '</' + k + '>'))
			: (U = U.replace(/>$/, ' />')),
		U
	);
}
m.shallowRender = g;
export default m;
export {
	m as render,
	m as renderToStaticMarkup,
	m as renderToString,
	g as shallowRender
};
//# sourceMappingURL=index.module.js.map
