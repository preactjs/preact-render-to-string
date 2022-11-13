/* eslint-disable */
// preact-render-to-string@5.2.6 (6a0bec2)
import { Fragment as e, options as t, h as r } from 'preact';
var n = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|^--/i,
	o = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/,
	i = /[\s\n\\/='"\0<>]/,
	l = /^xlink:?./,
	a = /["&<]/;
function s(e) {
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
var f = function (e, t) {
		return String(e).replace(/(\n+)/g, '$1' + (t || '\t'));
	},
	u = function (e, t, r) {
		return (
			String(e).length > (t || 40) ||
			(!r && -1 !== String(e).indexOf('\n')) ||
			-1 !== String(e).indexOf('<')
		);
	},
	c = {},
	_ = /([A-Z])/g;
function p(e) {
	var t = '';
	for (var r in e) {
		var o = e[r];
		null != o &&
			'' !== o &&
			(t && (t += ' '),
			(t +=
				'-' == r[0] ? r : c[r] || (c[r] = r.replace(_, '-$1').toLowerCase())),
			(t =
				'number' == typeof o && !1 === n.test(r)
					? t + ': ' + o + 'px;'
					: t + ': ' + o + ';'));
	}
	return t || void 0;
}
function d(e, t) {
	return (
		Array.isArray(t) ? t.reduce(d, e) : null != t && !1 !== t && e.push(t), e
	);
}
function v() {
	this.__d = !0;
}
function h(e, t) {
	return {
		__v: e,
		context: t,
		props: e.props,
		setState: v,
		forceUpdate: v,
		__d: !0,
		__h: []
	};
}
function g(e, t) {
	var r = e.contextType,
		n = r && t[r.__c];
	return null != r ? (n ? n.props.value : r.__) : t;
}
var y = [];
function m(r, n, a, c, _, v) {
	if (null == r || 'boolean' == typeof r) return '';
	if ('object' != typeof r) return 'function' == typeof r ? '' : s(r);
	var b = a.pretty,
		x = b && 'string' == typeof b ? b : '\t';
	if (Array.isArray(r)) {
		for (var k = '', S = 0; S < r.length; S++)
			b && S > 0 && (k += '\n'), (k += m(r[S], n, a, c, _, v));
		return k;
	}
	if (void 0 !== r.constructor) return '';
	var w,
		C = r.type,
		O = r.props,
		j = !1;
	if ('function' == typeof C) {
		if (((j = !0), !a.shallow || (!c && !1 !== a.renderRootComponent))) {
			if (C === e) {
				var A = [];
				return (
					d(A, r.props.children), m(A, n, a, !1 !== a.shallowHighOrder, _, v)
				);
			}
			var F,
				H = (r.__c = h(r, n));
			t.__b && t.__b(r);
			var M = t.__r;
			if (C.prototype && 'function' == typeof C.prototype.render) {
				var L = g(C, n);
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
				for (var T = g(C, n), E = 0; H.__d && E++ < 25; )
					(H.__d = !1), M && M(r), (F = C.call(r.__c, O, T));
			return (
				H.getChildContext && (n = Object.assign({}, n, H.getChildContext())),
				t.diffed && t.diffed(r),
				m(F, n, a, !1 !== a.shallowHighOrder, _, v)
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
					for (var r = -1, n = y.length; n--; )
						if (y[n] === e) {
							r = n;
							break;
						}
					r < 0 && (r = y.push(e) - 1), (t = 'UnnamedComponent' + r);
				}
				return t;
			})(w);
	}
	var $,
		D,
		N = '<' + C;
	if (O) {
		var P = Object.keys(O);
		a && !0 === a.sortAttributes && P.sort();
		for (var W = 0; W < P.length; W++) {
			var I = P[W],
				R = O[I];
			if ('children' !== I) {
				if (
					!i.test(I) &&
					((a && a.allAttributes) ||
						('key' !== I && 'ref' !== I && '__self' !== I && '__source' !== I))
				) {
					if ('defaultValue' === I) I = 'value';
					else if ('defaultChecked' === I) I = 'checked';
					else if ('defaultSelected' === I) I = 'selected';
					else if ('className' === I) {
						if (void 0 !== O.class) continue;
						I = 'class';
					} else
						_ &&
							l.test(I) &&
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
					var U = a.attributeHook && a.attributeHook(I, R, n, a, j);
					if (U || '' === U) N += U;
					else if ('dangerouslySetInnerHTML' === I) D = R && R.__html;
					else if ('textarea' === C && 'value' === I) $ = R;
					else if ((R || 0 === R || '' === R) && 'function' != typeof R) {
						if (!((!0 !== R && '' !== R) || ((R = I), a && a.xml))) {
							N = N + ' ' + I;
							continue;
						}
						if ('value' === I) {
							if ('select' === C) {
								v = R;
								continue;
							}
							'option' === C &&
								v == R &&
								void 0 === O.selected &&
								(N += ' selected');
						}
						N = N + ' ' + I + '="' + s(R) + '"';
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
	if (((N += '>'), i.test(C)))
		throw new Error(C + ' is not a valid HTML tag name in ' + N);
	var q,
		z = o.test(C) || (a.voidElements && a.voidElements.test(C)),
		Z = [];
	if (D) b && u(D) && (D = '\n' + x + f(D, x)), (N += D);
	else if (null != $ && d((q = []), $).length) {
		for (var B = b && ~N.indexOf('\n'), G = !1, J = 0; J < q.length; J++) {
			var K = q[J];
			if (null != K && !1 !== K) {
				var Q = m(K, n, a, !0, 'svg' === C || ('foreignObject' !== C && _), v);
				if ((b && !B && u(Q) && (B = !0), Q))
					if (b) {
						var X = Q.length > 0 && '<' != Q[0];
						G && X ? (Z[Z.length - 1] += Q) : Z.push(Q), (G = X);
					} else Z.push(Q);
			}
		}
		if (b && B) for (var Y = Z.length; Y--; ) Z[Y] = '\n' + x + f(Z[Y], x);
	}
	if (Z.length || D) N += Z.join('');
	else if (a && a.xml) return N.substring(0, N.length - 1) + ' />';
	return (
		!z || q || D
			? (b && ~N.indexOf('\n') && (N += '\n'), (N = N + '</' + C + '>'))
			: (N = N.replace(/>$/, ' />')),
		N
	);
}
var b = { shallow: !0 };
S.render = S;
var x = function (e, t) {
		return S(e, t, b);
	},
	k = [];
function S(n, o, i) {
	o = o || {};
	var l = t.__s;
	t.__s = !0;
	var a,
		s = r(e, null);
	return (
		(s.__k = [n]),
		(a =
			i &&
			(i.pretty ||
				i.voidElements ||
				i.sortAttributes ||
				i.shallow ||
				i.allAttributes ||
				i.xml ||
				i.attributeHook)
				? m(n, o, i)
				: F(n, o, !1, void 0, s)),
		t.__c && t.__c(n, k),
		(t.__s = l),
		(k.length = 0),
		a
	);
}
function w(e) {
	return null == e || 'boolean' == typeof e
		? null
		: 'string' == typeof e || 'number' == typeof e || 'bigint' == typeof e
		? r(null, null, e)
		: e;
}
function C(e, t) {
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
		: t && l.test(e)
		? e.toLowerCase().replace(/^xlink:?/, 'xlink:')
		: e;
}
function O(e, t) {
	return 'style' === e && null != t && 'object' == typeof t
		? p(t)
		: 'a' === e[0] && 'r' === e[1] && 'boolean' == typeof t
		? String(t)
		: t;
}
var j = Array.isArray,
	A = Object.assign;
function F(r, n, l, a, f) {
	if (null == r || !0 === r || !1 === r || '' === r) return '';
	if ('object' != typeof r) return 'function' == typeof r ? '' : s(r);
	if (j(r)) {
		var u = '';
		f.__k = r;
		for (var c = 0; c < r.length; c++)
			(u += F(r[c], n, l, a, f)), (r[c] = w(r[c]));
		return u;
	}
	if (void 0 !== r.constructor) return '';
	(r.__ = f), t.__b && t.__b(r);
	var _ = r.type,
		p = r.props;
	if ('function' == typeof _) {
		var d;
		if (_ === e) d = p.children;
		else {
			d =
				_.prototype && 'function' == typeof _.prototype.render
					? (function (e, r) {
							var n = e.type,
								o = g(n, r),
								i = new n(e.props, o);
							(e.__c = i),
								(i.__v = e),
								(i.__d = !0),
								(i.props = e.props),
								null == i.state && (i.state = {}),
								null == i.__s && (i.__s = i.state),
								(i.context = o),
								n.getDerivedStateFromProps
									? (i.state = A(
											{},
											i.state,
											n.getDerivedStateFromProps(i.props, i.state)
									  ))
									: i.componentWillMount &&
									  (i.componentWillMount(),
									  (i.state = i.__s !== i.state ? i.__s : i.state));
							var l = t.__r;
							return l && l(e), i.render(i.props, i.state, i.context);
					  })(r, n)
					: (function (e, r) {
							var n,
								o = h(e, r),
								i = g(e.type, r);
							e.__c = o;
							for (var l = t.__r, a = 0; o.__d && a++ < 25; )
								(o.__d = !1), l && l(e), (n = e.type.call(o, e.props, i));
							return n;
					  })(r, n);
			var v = r.__c;
			v.getChildContext && (n = A({}, n, v.getChildContext()));
		}
		var y = F(
			(d = null != d && d.type === e && null == d.key ? d.props.children : d),
			n,
			l,
			a,
			r
		);
		return (
			t.diffed && t.diffed(r), (r.__ = void 0), t.unmount && t.unmount(r), y
		);
	}
	var m,
		b,
		x = '<';
	if (((x += _), p))
		for (var k in ((m = p.children), p)) {
			var S = p[k];
			if (
				!(
					'key' === k ||
					'ref' === k ||
					'__self' === k ||
					'__source' === k ||
					'children' === k ||
					('className' === k && 'class' in p) ||
					('htmlFor' === k && 'for' in p) ||
					i.test(k)
				)
			)
				if (((S = O((k = C(k, l)), S)), 'dangerouslySetInnerHTML' === k))
					b = S && S.__html;
				else if ('textarea' === _ && 'value' === k) m = S;
				else if ((S || 0 === S || '' === S) && 'function' != typeof S) {
					if (!0 === S || '' === S) {
						(S = k), (x = x + ' ' + k);
						continue;
					}
					if ('value' === k) {
						if ('select' === _) {
							a = S;
							continue;
						}
						'option' !== _ || a != S || 'selected' in p || (x += ' selected');
					}
					x = x + ' ' + k + '="' + s(S) + '"';
				}
		}
	var H = x;
	if (((x += '>'), i.test(_)))
		throw new Error(_ + ' is not a valid HTML tag name in ' + x);
	var M = '',
		L = !1;
	if (b) (M += b), (L = !0);
	else if ('string' == typeof m) (M += s(m)), (L = !0);
	else if (j(m)) {
		r.__k = m;
		for (var T = 0; T < m.length; T++) {
			var E = m[T];
			if (((m[T] = w(E)), null != E && !1 !== E)) {
				var $ = F(E, n, 'svg' === _ || ('foreignObject' !== _ && l), a, r);
				$ && ((M += $), (L = !0));
			}
		}
	} else if (null != m && !1 !== m && !0 !== m) {
		r.__k = [w(m)];
		var D = F(m, n, 'svg' === _ || ('foreignObject' !== _ && l), a, r);
		D && ((M += D), (L = !0));
	}
	if ((t.diffed && t.diffed(r), (r.__ = void 0), t.unmount && t.unmount(r), L))
		x += M;
	else if (o.test(_)) return H + ' />';
	return x + '</' + _ + '>';
}
S.shallowRender = x;
export default S;
export {
	S as render,
	S as renderToStaticMarkup,
	S as renderToString,
	x as shallowRender
};
//# sourceMappingURL=index.module.js.map
