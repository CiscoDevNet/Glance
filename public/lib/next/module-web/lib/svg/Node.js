(function(nx) {
    var geometry = nx.geometry;
    /**
     * @class Node
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.Node", nx.lib.svg.AbstractNode, {
        mixins: [nx.geometry.MatrixSupport],
        properties: {
            /**
             * @property graph
             * @type {nx.lib.svg.Svg}
             */
            graph: {
                dependencies: "parentNode.graph"
            },
            /**
             * @property cssTransform
             * @type {String}
             * @readOnly
             */
            cssTransform: {
                dependencies: "matrix",
                value: function(matrix) {
                    if (matrix) {
                        return EXPORT.cssTransformMatrix(matrix);
                    }
                },
                watcher: function(pname, pvalue) {
                    if (pvalue) {
                        if (pvalue != "matrix(1,0,0,1,0,0)" || this.hasStyle("transform")) {
                            this.setStyle("transform", pvalue);
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
                dependencies: "parentNode.naturalTerminal, parentNode.naturalMatrix, matrix",
                value: function(term, pm, m, cause) {
                    if (term && cause.indexOf("parentNode.") == 0) {
                        return;
                    }
                    if (pm && m) {
                        this.naturalMatrix(geometry.Matrix.multiply(m, pm));
                    } else if (m) {
                        this.naturalMatrix(m || pm || geometry.Matrix.I);
                    }
                }
            },
            /**
             * @property naturalMatrix_internal_
             * @type {Number[3][3]}
             */
            naturalMatrix_internal_: {
                dependencies: "naturalMatrix",
                value: function(m) {
                    return m && new geometry.Matrix(m);
                }
            },
            /**
             * @property naturalPosition
             * @type {Number[2]}
             * @readOnly
             */
            naturalPosition: {
                dependencies: "naturalMatrix",
                value: function(m) {
                    return (m && [m[2][0], m[2][1]]) || [0, 0];
                }
            },
            /**
             * @property naturalRotate
             * @type {Number}
             * @readOnly
             */
            naturalRotate: {
                dependencies: "naturalMatrix_internal_.rotate"
            },
            /**
             * @property naturalScale
             * @type {Number}
             * @readOnly
             */
            naturalScale: {
                dependencies: "naturalMatrix_internal_.scale"
            }
        },
        methods: {
            init: function(tag) {
                this.inherited(tag || "g", nx.lib.svg.Svg.DEFAULT_XML_NAMESPACE);
            },
            applyNatureTranslate: function(x, y) {
                var parent = this.parentNode();
                var transmatrix = [
                    [1, 0, 0],
                    [0, 1, 0],
                    [x, y, 1]
                ];
                this.matrix(geometry.Matrix.multiply(this.naturalMatrix_internal_().getMatrixInversion(), transmatrix, this.naturalMatrix(), this.matrix()));
            }
        },
        statics: {
            cssTransformMatrix: function(matrix) {
                var css = [matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1], matrix[2][0], matrix[2][1]].join(",").replace(/-?\d+e[+-]?\d+/g, "0");
                return "matrix(" + css + ")";
            }
        }
    });
})(nx);
