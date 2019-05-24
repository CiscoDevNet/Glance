(function (nx, ui, toolkit, annotation, global) {
    var geometry = nxex.geometry;
    /**
     * @class Node
     * @namespace nxex.graph
     */
    var EXPORT = nx.define("nxex.graph.Node", nxex.graph.AbstractNode, {
        mixins: [nxex.geometry.MatrixSupport],
        view: {
            tag: "svg:g"
        },
        properties: {
            /**
             * @property graph
             * @type {nxex.graph.Graph}
             * @inherited
             */
            graph: {
                cascade: {
                    source: "parentNode.graph"
                }
            },
            /**
             * @property cssTransform
             * @type {String}
             * @readOnly
             */
            cssTransform: {
                cascade: {
                    source: "matrix",
                    output: function (matrix) {
                        if (matrix) {
                            return EXPORT.cssTransformMatrix(matrix);
                        }
                    }
                },
                watcher: function (pname, pvalue) {
                    var dom = this.resolve("@root");
                    if (pvalue) {
                        if (pvalue != "matrix(1,0,0,1,0,0)" || dom.hasStyle("transform")) {
                            dom.setStyle("transform", pvalue);
                        }
                    }
                }
            },
            naturalTerminal: {
                value: false
            },
            /**
             * @property naturalMatrix
             * @type {Number[3][3]}
             */
            naturalMatrix: {
                cascade: {
                    source: "parentNode.naturalTerminal, parentNode.naturalMatrix, matrix",
                    update: function (term, pm, m, cause) {
                        if (term && cause.indexOf("parentNode.") == 0) {
                            return;
                        }
                        if (pm && m) {
                            this.naturalMatrix(geometry.Matrix.multiply(m, pm));
                        } else if (m) {
                            this.naturalMatrix(m || pm || geometry.Matrix.I);
                        }
                    }
                }
            },
            /**
             * @property naturalMatrix_internal_
             * @type {Number[3][3]}
             */
            naturalMatrix_internal_: {
                cascade: {
                    source: "naturalMatrix",
                    output: function (m) {
                        return m && new geometry.Matrix(m);
                    }
                }
            },
            /**
             * @property naturalPosition
             * @type {Number[2]}
             * @readOnly
             */
            naturalPosition: {
                value: [0, 0],
                cascade: {
                    source: "naturalMatrix",
                    output: function (m) {
                        return m && [m[2][0], m[2][1]];
                    }
                },
                get: function () {
                    return this._naturalPosition.slice();
                }
            },
            /**
             * @property naturalRotate
             * @type {Number}
             * @readOnly
             */
            naturalRotate: {
                value: 0,
                cascade: {
                    source: "naturalMatrix_internal_.rotate"
                }
            },
            /**
             * @property naturalScale
             * @type {Number}
             * @readOnly
             */
            naturalScale: {
                value: 1,
                cascade: {
                    source: "naturalMatrix_internal_.scale"
                }
            }
        },
        methods: {
            applyNatureTranslate: function (x, y) {
                var parent = this.parentNode();
                var transmatrix = [[1, 0, 0], [0, 1, 0], [x, y, 1]];
                this.matrix(geometry.Matrix.multiply(this.naturalMatrix_internal_().getMatrixInversion(), transmatrix, this.naturalMatrix(), this.matrix()));
            }
        },
        statics: {
            cssTransformMatrix: function (matrix) {
                var css = [matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1], matrix[2][0], matrix[2][1]].join(",").replace(/-?\d+e[+-]?\d+/g, "0");
                return "matrix(" + css + ")";
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
