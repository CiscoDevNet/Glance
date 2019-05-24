(function (nx, ui, toolkit, global) {

    var Vector = nxex.geometry.Vector;
    var multiply = Vector.multiply;
    var rotate = Vector.rotate;
    var length = Vector.abs;
    var plus = Vector.plus;
    var golden = Math.sqrt(5) / 2 - .5;

    /**
     * @class Rectangle
     * @extends nxex.graph.shape.Path
     * @namespace nxex.graph
     */
    var EXPORT = nx.define("nxex.graph.shape.PathLine", nxex.graph.shape.Path, {
        properties: {
            operationsUpdater_internal_: {
                value: [],
                cascade: {
                    source: "dx, dy, dh",
                    update: function (dx, dy, dh) {
                        if (!dh) {
                            this.vectors([[dx, dy]]);
                        } else {
                            var v0 = [dx, dy], vd = rotate(length([dx, dy], dh), Math.PI / 2), pt = plus(multiply(v0, .5), vd);
                            var d = "M 0 0";
                            d += " " + ["C"].concat(plus(multiply(vd, golden), multiply(v0, 1 / 6))).concat(plus(vd, multiply(v0, 1 / 3))).concat(pt).join(" ");
                            d += " " + ["C"].concat(plus(vd, multiply(v0, 2 / 3))).concat(plus(multiply(vd, golden), multiply(v0, 5 / 6))).concat(v0).join(" ");
                            this.d(d);
                        }
                    }
                }
            },
            /**
             * @property dx
             * @type {Number}
             */
            dx: {
                value: 100
            },
            /**
             * @property dy
             * @type {Number}
             */
            dy: {
                value: 0
            },
            /**
             * @property dh
             * @type {Number}
             */
            dh: {
                value: 0
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, window);
