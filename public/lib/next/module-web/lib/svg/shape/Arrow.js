(function(nx) {

    // short cuts of functions

    var geometry = nx.geometry;
    var Vector = geometry.Vector;
    var rotate = Vector.rotate;
    var length = Vector.abs;
    var multiply = Vector.multiply;
    var plus = Vector.plus;
    var vect = function(v, l, a) {
        v = multiply(v, l);
        if (a) {
            v = rotate(v, a);
        }
        return v;
    };

    var PI = Math.PI;
    var abs = Math.abs,
        sin = geometry.Math.sin,
        cos = geometry.Math.cos,
        tan = geometry.Math.tan,
        cot = geometry.Math.cot;
    var D90 = PI / 2;

    /**
     * @class Arrow
     * @extends nx.lib.svg.PathLine
     * @namespace nx.lib.svg.shape
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Arrow", nx.lib.svg.shape.PathLine, {
        view: {
            cssclass: "arrow"
        },
        properties: {
            stroke: {
                watcher: function(pname, pvalue) {
                    if (pvalue && pvalue != "inherit") {
                        this.setAttribute("fill", pvalue);
                    }
                }
            },
            strokeWidth: {
                value: "inherit",
                watcher: nx.idle
            },
            fill: {
                watcher: nx.idle
            },
            operationsUpdater_internal_: {
                dependencies: "strokeWidthComputed,dx,dy,dh,sharpness,concavity",
                async: true,
                value: function(async, strokeWidthComputed, dx, dy, dh, sharpness, concavity) {
                    var all_numbers = ([strokeWidthComputed, dx, dy, dh, sharpness, concavity].findIndex(function(v) {
                        return !nx.is(v, "Number");
                    }) < 0);
                    if (!all_numbers || strokeWidthComputed == 0 || (dx == 0 && dy == 0)) {
                        return;
                    }
                    var vectors = [];
                    // update the sharpness and concavity
                    concavity = concavity || PI;
                    // add vectors
                    var v = [dx, dy],
                        i = length(v, 1);
                    // prepare data
                    var len = length(v),
                        width = strokeWidthComputed;
                    var a = sharpness / 2,
                        b = concavity / 2,
                        w = width / 2;
                    var len0 = len - w * (cot(a) * 2 - cot(b));
                    // make sure the sharpness is reasonable and the arrow head won't take too much place
                    if (sharpness > 0 && sharpness <= PI && (w * 4 / len < tan(a))) {
                        // start create vectors
                        vectors.push(vect(i, w, D90));
                        vectors.push(vect(i, len0));
                        vectors.push(vect(i, w / sin(b), PI - b));
                        vectors.push(vect(i, width / sin(a), -a));
                        vectors.push(vect(i, width / sin(a), PI + a));
                        vectors.push(vect(i, w / sin(b), b));
                        vectors.push(vect(i, -len0));
                        vectors.push(vect(i, w, D90));
                    } else {
                        vectors.push(vect(i, w, D90));
                        vectors.push([dx, dy]);
                        vectors.push(vect(i, w * 2, -D90));
                        vectors.push([-dx, -dy]);
                        vectors.push(vect(i, w, D90));
                    }
                    this.vectors(vectors);
                }
            },
            /**
             * @property sharpnessDeg
             * @type {Number}
             */
            sharpnessDeg: {
                value: 30
            },
            /**
             * @property sharpness
             * @type {Number}
             */
            sharpness: {
                dependencies: "sharpnessDeg",
                value: function(deg) {
                    if (deg) {
                        return deg * PI / 180;
                    }
                    return PI / 6;
                }
            },
            /**
             * @property concavityDeg
             * @type {Number}
             */
            concavityDeg: {
                value: 0
            },
            /**
             * @property concavity
             * @type {Number}
             */
            concavity: {
                dependencies: "concavityDeg",
                value: function(deg) {
                    if (deg) {
                        return deg * PI / 180;
                    }
                    return PI;
                }
            }
        },
        methods: {
            init: function(options) {
                this.inherited(options);
                this.setAttribute("stroke-width", 0);
            }
        }
    });
})(nx);
