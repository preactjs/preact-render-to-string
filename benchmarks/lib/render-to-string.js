/* eslint-disable */
// preact-render-to-string@5.1.22 (7cdf4d6)
import { Fragment as e, options as t } from 'preact';
var r = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|^--/i,
	n = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/,
	o = /[\s\n\\/='"\0<>]/,
	i = /^xlink:?./,
	a = /["&<]/;
function l(e) {
	if (!1 === a.test((e += ''))) return e;
	for (var t = 0, r = 0, n = '', o = ''; r < e.length; r++) {
		switch (e.charCodeAt(r)) {
			case 34:
				o = '&quot;';
				break;
			case 38:
				o = '&amp;';
				break;
			case 60:
				o = '&lt;';
				break;
			default:
				continue;
		}
		r !== t && (n += e.slice(t, r)), (n += o), (t = r + 1);
	}
	return r !== t && (n += e.slice(t, r)), n;
}
var s = function (e, t) {
		return String(e).replace(/(\n+)/g, '$1' + (t || '\t'));
	},
	f = function (e, t, r) {
		return (
			String(e).length > (t || 40) ||
			(!r && -1 !== String(e).indexOf('\n')) ||
			-1 !== String(e).indexOf('<')
		);
	},
	c = {},
	u = /([A-Z])/g;
function p(e) {
	var t = '';
	for (var n in e) {
		var o = e[n];
		null != o &&
			'' !== o &&
			(t && (t += ' '),
			(t +=
				'-' == n[0] ? n : c[n] || (c[n] = n.replace(u, '-$1').toLowerCase())),
			(t =
				'number' == typeof o && !1 === r.test(n)
					? t + ': ' + o + 'px;'
					: t + ': ' + o + ';'));
	}
	return t || void 0;
}
function _(e, t) {
	return (
		Array.isArray(t) ? t.reduce(_, e) : null != t && !1 !== t && e.push(t), e
	);
}
function d() {
	this.__d = !0;
}
function v(e, t) {
	return {
		__v: e,
		context: t,
		props: e.props,
		setState: d,
		forceUpdate: d,
		__d: !0,
		__h: []
	};
}
function h(e, t) {
	var r = e.contextType,
		n = r && t[r.__c];
	return null != r ? (n ? n.props.value : r.__) : t;
}
var g = [];
function y(r, a, c, u, d, m) {
	if (null == r || 'boolean' == typeof r) return '';
	if ('object' != typeof r) return l(r);
	var b = c.pretty,
		x = b && 'string' == typeof b ? b : '\t';
	if (Array.isArray(r)) {
		for (var k = '', S = 0; S < r.length; S++)
			b && S > 0 && (k += '\n'), (k += y(r[S], a, c, u, d, m));
		return k;
	}
	var w,
		C = r.type,
		O = r.props,
		j = !1;
	if ('function' == typeof C) {
		if (((j = !0), !c.shallow || (!u && !1 !== c.renderRootComponent))) {
			if (C === e) {
				var A = [];
				return (
					_(A, r.props.children), y(A, a, c, !1 !== c.shallowHighOrder, d, m)
				);
			}
			var F,
				H = (r.__c = v(r, a));
			t.__b && t.__b(r);
			var M = t.__r;
			if (C.prototype && 'function' == typeof C.prototype.render) {
				var L = h(C, a);
				((H = r.__c = new C(O, L)).__v = r),
					(H._dirty = H.__d = !0),
					(H.props = O),
					null == H.state && (H.state = {}),
					null == H._nextState &&
						null == H.__s &&
						(H._nextState = H.__s = H.state),
					(H.context = L),
					C.getDerivedStateFromProps
						? (H.state = Object.assign(
								{},
								H.state,
								C.getDerivedStateFromProps(H.props, H.state)
						  ))
						: H.componentWillMount &&
						  (H.componentWillMount(),
						  (H.state =
								H._nextState !== H.state
									? H._nextState
									: H.__s !== H.state
									? H.__s
									: H.state)),
					M && M(r),
					(F = H.render(H.props, H.state, H.context));
			} else
				for (var T = h(C, a), E = 0; H.__d && E++ < 25; )
					(H.__d = !1), M && M(r), (F = C.call(r.__c, O, T));
			return (
				H.getChildContext && (a = Object.assign({}, a, H.getChildContext())),
				t.diffed && t.diffed(r),
				y(F, a, c, !1 !== c.shallowHighOrder, d, m)
			);
		}
		C =
			(w = C).displayName ||
			(w !== Function && w.name) ||
			(function (e) {
				var t = (Function.prototype.toString
					.call(e)
					.match(/^\s*function\s+([^( ]+)/) || '')[1];
				if (!t) {
					for (var r = -1, n = g.length; n--; )
						if (g[n] === e) {
							r = n;
							break;
						}
					r < 0 && (r = g.push(e) - 1), (t = 'UnnamedComponent' + r);
				}
				return t;
			})(w);
	}
	var $,
		D,
		N = '<' + C;
	if (O) {
		var P = Object.keys(O);
		c && !0 === c.sortAttributes && P.sort();
		for (var W = 0; W < P.length; W++) {
			var I = P[W],
				R = O[I];
			if ('children' !== I) {
				if (
					!o.test(I) &&
					((c && c.allAttributes) ||
						('key' !== I && 'ref' !== I && '__self' !== I && '__source' !== I))
				) {
					if ('defaultValue' === I) I = 'value';
					else if ('defaultChecked' === I) I = 'checked';
					else if ('defaultSelected' === I) I = 'selected';
					else if ('className' === I) {
						if (void 0 !== O.class) continue;
						I = 'class';
					} else
						d &&
							i.test(I) &&
							(I = I.toLowerCase().replace(/^xlink:?/, 'xlink:'));
					if ('htmlFor' === I) {
						if (O.for) continue;
						I = 'for';
					}
					'style' === I && R && 'object' == typeof R && (R = p(R)),
						'a' === I[0] &&
							'r' === I[1] &&
							'boolean' == typeof R &&
							(R = String(R));
					var U = c.attributeHook && c.attributeHook(I, R, a, c, j);
					if (U || '' === U) N += U;
					else if ('dangerouslySetInnerHTML' === I) D = R && R.__html;
					else if ('textarea' === C && 'value' === I) $ = R;
					else if ((R || 0 === R || '' === R) && 'function' != typeof R) {
						if (!((!0 !== R && '' !== R) || ((R = I), c && c.xml))) {
							N = N + ' ' + I;
							continue;
						}
						if ('value' === I) {
							if ('select' === C) {
								m = R;
								continue;
							}
							'option' === C &&
								m == R &&
								void 0 === O.selected &&
								(N += ' selected');
						}
						N = N + ' ' + I + '="' + l(R) + '"';
					}
				}
			} else $ = R;
		}
	}
	if (b) {
		var V = N.replace(/\n\s*/, ' ');
		V === N || ~V.indexOf('\n')
			? b && ~N.indexOf('\n') && (N += '\n')
			: (N = V);
	}
	if (((N += '>'), o.test(C)))
		throw new Error(C + ' is not a valid HTML tag name in ' + N);
	var q,
		z = n.test(C) || (c.voidElements && c.voidElements.test(C)),
		Z = [];
	if (D) b && f(D) && (D = '\n' + x + s(D, x)), (N += D);
	else if (null != $ && _((q = []), $).length) {
		for (var B = b && ~N.indexOf('\n'), G = !1, J = 0; J < q.length; J++) {
			var K = q[J];
			if (null != K && !1 !== K) {
				var Q = y(K, a, c, !0, 'svg' === C || ('foreignObject' !== C && d), m);
				if ((b && !B && f(Q) && (B = !0), Q))
					if (b) {
						var X = Q.length > 0 && '<' != Q[0];
						G && X ? (Z[Z.length - 1] += Q) : Z.push(Q), (G = X);
					} else Z.push(Q);
			}
		}
		if (b && B) for (var Y = Z.length; Y--; ) Z[Y] = '\n' + x + s(Z[Y], x);
	}
	if (Z.length || D) N += Z.join('');
	else if (c && c.xml) return N.substring(0, N.length - 1) + ' />';
	return (
		!z || q || D
			? (b && ~N.indexOf('\n') && (N += '\n'), (N = N + '</' + C + '>'))
			: (N = N.replace(/>$/, ' />')),
		N
	);
}
var m = { shallow: !0 };
k.render = k;
var b = function (e, t) {
		return k(e, t, m);
	},
	x = [];
function k(e, r, n) {
	r = r || {};
	var o,
		i = t.__s;
	return (
		(t.__s = !0),
		(o =
			n &&
			(n.pretty ||
				n.voidElements ||
				n.sortAttributes ||
				n.shallow ||
				n.allAttributes ||
				n.xml ||
				n.attributeHook)
				? y(e, r, n)
				: j(e, r, !1, void 0)),
		t.__c && t.__c(e, x),
		(t.__s = i),
		(x.length = 0),
		o
	);
}
function S(e, t) {
	return 'className' === e
		? 'class'
		: 'htmlFor' === e
		? 'for'
		: 'defaultValue' === e
		? 'value'
		: 'defaultChecked' === e
		? 'checked'
		: 'defaultSelected' === e
		? 'selected'
		: t && i.test(e)
		? e.toLowerCase().replace(/^xlink:?/, 'xlink:')
		: e;
}
function w(e, t) {
	return 'style' === e && null != t && 'object' == typeof t
		? p(t)
		: 'a' === e[0] && 'r' === e[1] && 'boolean' == typeof t
		? String(t)
		: t;
}
var C = Array.isArray,
	O = Object.assign;
function j(r, i, a, s) {
	if (null == r || !0 === r || !1 === r || '' === r) return '';
	if ('object' != typeof r) return l(r);
	if (C(r)) {
		for (var f = '', c = 0; c < r.length; c++) f += j(r[c], i, a, s);
		return f;
	}
	t.__b && t.__b(r);
	var u = r.type,
		p = r.props;
	if ('function' == typeof u) {
		if (u === e) return j(r.props.children, i, a, s);
		var _;
		_ =
			u.prototype && 'function' == typeof u.prototype.render
				? (function (e, r) {
						var n = e.type,
							o = h(n, r),
							i = new n(e.props, o);
						(e.__c = i),
							(i.__v = e),
							(i.__d = !0),
							(i.props = e.props),
							null == i.state && (i.state = {}),
							null == i.__s && (i.__s = i.state),
							(i.context = o),
							n.getDerivedStateFromProps
								? (i.state = O(
										{},
										i.state,
										n.getDerivedStateFromProps(i.props, i.state)
								  ))
								: i.componentWillMount &&
								  (i.componentWillMount(),
								  (i.state = i.__s !== i.state ? i.__s : i.state));
						var a = t.__r;
						return a && a(e), i.render(i.props, i.state, i.context);
				  })(r, i)
				: (function (e, r) {
						var n,
							o = v(e, r),
							i = h(e.type, r);
						e.__c = o;
						for (var a = t.__r, l = 0; o.__d && l++ < 25; )
							(o.__d = !1), a && a(e), (n = e.type.call(o, e.props, i));
						return n;
				  })(r, i);
		var d = r.__c;
		d.getChildContext && (i = O({}, i, d.getChildContext()));
		var g = j(_, i, a, s);
		return t.diffed && t.diffed(r), g;
	}
	var y,
		m,
		b = '<';
	if (((b += u), p))
		for (var x in ((y = p.children), p)) {
			var k = p[x];
			if (
				!(
					'key' === x ||
					'ref' === x ||
					'__self' === x ||
					'__source' === x ||
					'children' === x ||
					('className' === x && 'class' in p) ||
					('htmlFor' === x && 'for' in p) ||
					o.test(x)
				)
			)
				if (((k = w((x = S(x, a)), k)), 'dangerouslySetInnerHTML' === x))
					m = k && k.__html;
				else if ('textarea' === u && 'value' === x) y = k;
				else if ((k || 0 === k || '' === k) && 'function' != typeof k) {
					if (!0 === k || '' === k) {
						(k = x), (b = b + ' ' + x);
						continue;
					}
					if ('value' === x) {
						if ('select' === u) {
							s = k;
							continue;
						}
						'option' !== u || s != k || 'selected' in p || (b += ' selected');
					}
					b = b + ' ' + x + '="' + l(k) + '"';
				}
		}
	var A = b;
	if (((b += '>'), o.test(u)))
		throw new Error(u + ' is not a valid HTML tag name in ' + b);
	var F = '',
		H = !1;
	if (m) (F += m), (H = !0);
	else if ('string' == typeof y) (F += l(y)), (H = !0);
	else if (C(y))
		for (var M = 0; M < y.length; M++) {
			var L = y[M];
			if (null != L && !1 !== L) {
				var T = j(L, i, 'svg' === u || ('foreignObject' !== u && a), s);
				T && ((F += T), (H = !0));
			}
		}
	else if (null != y && !1 !== y && !0 !== y) {
		var E = j(y, i, 'svg' === u || ('foreignObject' !== u && a), s);
		E && ((F += E), (H = !0));
	}
	if ((t.diffed && t.diffed(r), H)) b += F;
	else if (n.test(u)) return A + ' />';
	return b + '</' + u + '>';
}
k.shallowRender = b;
export default k;
export {
	k as render,
	k as renderToStaticMarkup,
	k as renderToString,
	b as shallowRender
};
//# sourceMappingURL=index.module.js.map
