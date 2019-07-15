(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class Node
     * @namespace nxex.graph
     */
    var EXPORT = nx.define("nxex.graph.AbstractNode", nxex.struct.Element, {
        properties: {
            structBaseType: {
                value: function () {
                    return nxex.graph.Node;
                }
            },
            /**
             * @property graph
             * @type {nxex.graph.Graph}
             */
            graph: {},
            // Drawing properties
            /**
             * @property fill
             * @type {String/Number}
             */
            fill: {
                value: "inherit",
                watcher: function (pname, pvalue) {
                    if (pvalue && pvalue != "inherit") {
                        this.resolve("@root").setStyle("fill", pvalue);
                    } else {
                        this.resolve("@root").removeStyle("fill");
                    }
                }
            },
            /**
             * @property fillComputed
             * @type {Number}
             * @readOnly
             */
            fillComputed: {
                value: 0,
                cascade: {
                    source: "fill,parentNode.strokeComputed",
                    output: function (v, pv) {
                        return (v && v != "inherit") ? v : (pv || "black");
                    }
                }
            },
            /**
             * @property stroke
             * @type {String/Number}
             */
            stroke: {
                value: "inherit",
                watcher: function (pname, pvalue) {
                    if (pvalue && pvalue != "inherit") {
                        this.resolve("@root").setStyle("stroke", pvalue);
                    } else {
                        this.resolve("@root").removeStyle("stroke");
                    }
                }
            },
            /**
             * @property strokeComputed
             * @type {Number}
             * @readOnly
             */
            strokeComputed: {
                value: 0,
                cascade: {
                    source: "stroke,parentNode.strokeComputed",
                    output: function (v, pv) {
                        return (v && v != "inherit") ? v : (pv || "black");
                    }
                }
            },
            /**
             * @property strokeWidth
             * @type {String/Number}
             */
            strokeWidth: {
                value: "inherit",
                watcher: function (pname, pvalue) {
                    if (pvalue && pvalue != "inherit") {
                        this.resolve("@root").setStyle("stroke-width", pvalue);
                    } else {
                        this.resolve("@root").removeStyle("stroke-width");
                    }
                }
            },
            /**
             * @property strokeWidthComputed
             * @type {Number}
             * @readOnly
             */
            strokeWidthComputed: {
                value: 0,
                cascade: {
                    source: "strokeWidth,parentNode.strokeWidthComputed",
                    output: function (v, pv) {
                        return (v >= 0) ? v : (pv || 0);
                    }
                }
            }
        },
        methods: {
            hierarchy: function () {
                var rslt = [this],
                    node = this.parentNode();
                while (node) {
                    rslt.unshift(node);
                    node = node.parentNode();
                }
                return rslt;
            }
        },
        statics: {
            cssTransformMatrix: function (matrix) {
                if (!matrix) {
                    // no transform for no matrix
                    return "";
                }
                var css = [matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1], matrix[2][0], matrix[2][1]].join(",").replace(/-?\d+e[+-]?\d+/g, "0");
                return "matrix(" + css + ")";
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
