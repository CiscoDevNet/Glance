(function (nx) {
    /**
     * @class Rectangle
     * @extends nx.lib.svg.shape.Path
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Text", nx.lib.svg.Node, {
        methods: {
            init: function () {
                this.inherited("text");
            }
        },
        view: {
            properties: {
                class: "text"
            }
        },
        properties: {
            text: {
                value: "",
                watcher: function (pname, pvalue) {
                    this.release("text");
                    this.retain("text", this.append(pvalue));
                }
            },
            textAnchor: {
                value: "middle",
                watcher: function (pname, pvalue) {
                    this.setAttribute("text-anchor", pvalue);
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                "svg text": {
                    "stroke": "none"
                }
            })
        }
    });
})(nx);
