(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class Math
     * @namespace nxex.geometry
     */
    var EXPORT = nx.define("nxex.geometry.Math", nx.Observable, {
        statics: (function () {
            function precised(f) {
                return function (param) {
                    var v = f(param);
                    return EXPORT.approximate(v, 0) ? 0 : v;
                }
            }
            return {
                approximate: function (a, b, precision) {
                    precision = precision || 1e-10;
                    var v = a - b;
                    return v < precision && v > -precision;
                },
                square: function (v) {
                    return v * v;
                },
                sin: precised(Math.sin),
                cos: precised(Math.cos),
                tan: precised(Math.tan),
                cot: function (a) {
                    var tan = Math.tan(a);
                    if (tan > 1e10 || tan < -1e10) {
                        return 0;
                    }
                    return 1 / tan;
                }
            };
        })()
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
