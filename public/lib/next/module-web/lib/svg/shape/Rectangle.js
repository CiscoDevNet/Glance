(function (nx) {
    /**
     * @class Rectangle
     * @extends nx.lib.svg.shape.Path
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Rectangle", nx.lib.svg.Node, {
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
                dependencies: "center, width, height",
                value: function (center, width, height) {
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
                },
                watcher: function (pname, pvalue) {
                    if (pvalue) {
                        nx.each(["x", "y", "width", "height"], function (attr, idx) {
                            if (pvalue[idx]) {
                                this.setAttribute(attr, pvalue[idx]);
                            } else {
                                this.removeAttribute(attr);
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
                        this.setAttribute("rx", pvalue);
                    } else {
                        this.removeAttribute("rx");
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
                        this.setAttribute("ry", pvalue);
                    } else {
                        this.removeAttribute("ry");
                    }
                }
            }
        },
        methods: {
            init: function () {
                this.inherited("rect");
            }
        }
    });
})(nx);
