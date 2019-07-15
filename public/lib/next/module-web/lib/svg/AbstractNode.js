(function (nx) {
    /**
     * @class Node
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.AbstractNode", nx.ui.Element, {
        properties: {
            childDefaultType: {
                value: function () {
                    return nx.lib.svg.Node;
                }
            },
            /**
             * @property graph
             * @type {nx.lib.svg.Svg}
             */
            graph: null,
            // Drawing properties
            /**
             * @property fill
             * @type {String/Number}
             */
            fill: {
                value: "inherit",
                watcher: function (pname, pvalue) {
                    if (pvalue && pvalue != "inherit") {
                        this.setStyle("fill", pvalue);
                    } else {
                        this.removeStyle("fill");
                    }
                }
            },
            /**
             * @property fillComputed
             * @type {Number}
             * @readOnly
             */
            fillComputed: {
                dependencies: "fill,parentNode.strokeComputed",
                value: function (v, pv) {
                    return (v && v != "inherit") ? v : (pv || "black");
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
                        this.setStyle("stroke", pvalue);
                    } else {
                        this.removeStyle("stroke");
                    }
                }
            },
            /**
             * @property strokeComputed
             * @type {Number}
             * @readOnly
             */
            strokeComputed: {
                dependencies: "stroke,parentNode.strokeComputed",
                value: function (v, pv) {
                    return (v && v != "inherit") ? v : (pv || "black");
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
                        this.setStyle("stroke-width", pvalue);
                    } else {
                        this.removeStyle("stroke-width");
                    }
                }
            },
            /**
             * @property strokeWidthComputed
             * @type {Number}
             * @readOnly
             */
            strokeWidthComputed: {
                dependencies: "strokeWidth,parentNode.strokeWidthComputed",
                value: function (v, pv) {
                    return (v >= 0) ? v : (pv || 0);
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
})(nx);
