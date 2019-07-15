(function (nx, ui, toolkit, global) {
    /**
     * @class Rectangle
     * @extends nxex.graph.shape.Path
     * @namespace nxex.graph
     */
    var EXPORT = nx.define("nxex.graph.shape.Rectangle", nxex.graph.Node, {
        view: {
            tag: "svg:rect"
        },
        properties: {
            /**
             * @property center
             * @type {Boolean}
             */
            center: {
                value: false
            },
            /**
             * @property width
             * @type {Number}
             */
            width: {
                value: 0
            },
            /**
             * @property height
             * @type {Number}
             */
            height: {
                value: 0
            },
            /**
             * @property bound_internal_
             * @type {Number[4]}
             * @private
             */
            bound_internal_: {
                cascade: {
                    source: "center, width, height",
                    output: function (center, width, height) {
                        var x, y, w, h;
                        w = Math.abs(width);
                        h = Math.abs(height);
                        if (center) {
                            x = -w / 2;
                            y = -h / 2;
                        } else {
                            x = (width < 0 ? width : 0);
                            y = (height < 0 ? height : 0);
                        }
                        return [x, y, w, h];
                    }
                },
                watcher: function (pname, pvalue) {
                    if (pvalue) {
                        nx.each(["x", "y", "width", "height"], function (attr, idx) {
                            if (pvalue[idx]) {
                                this.resolve("@root").setAttribute(attr, pvalue[idx]);
                            } else {
                                this.resolve("@root").removeAttribute(attr);
                            }
                        }.bind(this));
                    }
                }
            },
            /**
             * @property rx
             * @type {Number}
             */
            rx: {
                value: 0,
                watcher: function (pname, pvalue) {
                    if (pvalue) {
                        this.resolve("@root").setAttribute("rx", pvalue);
                    } else {
                        this.resolve("@root").removeAttribute("rx");
                    }
                }
            },
            /**
             * @property ry
             * @type {Number}
             */
            ry: {
                value: 0,
                watcher: function (pname, pvalue) {
                    if (pvalue) {
                        this.resolve("@root").setAttribute("ry", pvalue);
                    } else {
                        this.resolve("@root").removeAttribute("ry");
                    }
                }
            }
        },
        methods: {}
    });
})(nx, nx.ui, nxex.toolkit, window);
