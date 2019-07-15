(function (nx, ui, toolkit, global) {
    /**
     * @class Rectangle
     * @extends nxex.graph.shape.Path
     * @namespace nxex.graph
     */
    var EXPORT = nx.define("nxex.graph.shape.Text", nxex.graph.Node, {
        view: {
            tag: "svg:text",
            props: {
                class: "text"
            }
        },
        properties: {
            text: {
                value: "",
                watcher: function (pname, pvalue) {
                    this.resolve("@root").set("html", pvalue);
                }
            },
            textAnchor: {
                value: "middle",
                watcher: function (pname, pvalue) {
                    this.resolve("@root").set("text-anchor", pvalue);
                }
            }
        },
        statics: {
            CSS: toolkit.css({
                "svg text": {
                    "stroke": "none"
                }
            })
        }
    });
})(nx, nx.ui, nxex.toolkit, window);
