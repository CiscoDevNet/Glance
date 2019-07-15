(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class Vector
     * @namespace nxex.geometry
     */
    var EXPORT = nx.define("nxex.geometry.Vector", nx.Observable, {
        statics: {
            approximate: function (v1, v2, precision) {
                if (!v1 || !v2 || v1.length != v2.length) {
                    return false;
                }
                var i;
                for (i = 0; i < v1.length; i++) {
                    if (!nxex.geometry.Math.approximate(v1[i], v2[i], precision)) {
                        return false;
                    }
                }
                return true;
            },
            equal: function (v1, v2) {
                if (!v1 || !v2 || v1.length != v2.length) {
                    return false;
                }
                var i;
                for (i = 0; i < v1.length; i++) {
                    if (v1[i] !== v2[i]) {
                        return false;
                    }
                }
                return true;
            },
            plus: function (v1, v2) {
                return [v1[0] + v2[0], v1[1] + v2[1]];
            },
            transform: function (v, m) {
                var matrices = [[v.concat([1])]].concat(Array.prototype.slice.call(arguments, 1));
                return nxex.geometry.Matrix.multiply.apply(nxex.geometry.Matrix, matrices)[0].slice(0, 2);
            },
            multiply: function (v, k) {
                return EXPORT.transform(v, [[k, 0, 0], [0, k, 0], [0, 0, 1]]);
            },
            abs: function (v, len) {
                if (arguments.length == 1) {
                    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
                }
                var weight = len / EXPORT.abs(v);
                return EXPORT.transform(v, [[weight, 0, 0], [0, weight, 0], [0, 0, 1]]);
            },
            reverse: function (v) {
                return EXPORT.transform(v, [[-1, 0, 0], [0, -1, 0], [0, 0, 1]]);
            },
            rotate: function (v, a) {
                var sin = nxex.geometry.Math.sin(a), cos = nxex.geometry.Math.cos(a);
                return EXPORT.transform(v, [[cos, sin, 0], [-sin, cos, 0], [0, 0, 1]]);
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
