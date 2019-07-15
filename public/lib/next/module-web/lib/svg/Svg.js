(function(nx) {
    /**
     * @class Canvas
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.Svg", nx.lib.svg.AbstractNode, {
        view: {
            content: {
                name: "defs",
                type: "nx.lib.svg.SvgDefs"
            }
        },
        properties: {
            /**
             * @property graph
             * @type {nx.lib.svg.Svg}
             */
            graph: {
                value: function() {
                    return this;
                }
            },
            /**
             * @property naturalTerminal
             * @type {Boolean}
             */
            naturalTerminal: {
                value: false
            }
        },
        methods: {
            init: function() {
                this.inherited("svg", "http://www.w3.org/2000/svg");
            },
            getWidth: function() {
                return this.$dom.offsetWidth;
            },
            getHeight: function() {
                return this.$dom.offsetHeight;
            },
            serialize: function(toDataUrl) {
                return EXPORT.serialize(this.dom(), toDataUrl);
            }
        },
        statics: {
            DEFAULT_XML_NAMESPACE: "http://www.w3.org/2000/svg",
            getSvgSize: function(svg) {
                var width = svg.getAttribute("width");
                var height = svg.getAttribute("height");
                var vb = svg.getAttribute("viewBox");
                if (width) {
                    width = width.replace(/[^-.0123456789]/g, "") * 1;
                }
                if (height) {
                    height = height.replace(/[^-.0123456789]/g, "") * 1;
                }
                if (vb) {
                    vb = vb.split(" ");
                    width = width || vb[2] * 1 || 0;
                    height = height || vb[3] * 1 || 0;
                }
                return {
                    width: width || 0,
                    height: height || 0
                };
            },
            serialize: function(dom, toDataUrl) {
                var serializer = new XMLSerializer();
                var serialized = serializer.serializeToString(dom);
                if (toDataUrl !== false) {
                    return "data:image/svg+xml;utf8," + serialized;
                } else {
                    return serialized;
                }
            }
        }
    });
    nx.util.csssheet.create({
        // FIXME I used to add 'stroke:black;fill:transparent' here, but I forgot why
        "svg text": {
            "user-select": "none"
        }
    });
})(nx);
