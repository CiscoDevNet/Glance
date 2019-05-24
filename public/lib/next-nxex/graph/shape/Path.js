(function (nx, ui, toolkit, global) {

    // short cuts of functions

    /**
     * @class Path
     * @extends nxex.graph.Node
     * @namespace nxex.graph
     */
    var EXPORT = nx.define("nxex.graph.shape.Path", nxex.graph.Node, {
        view: {
            tag: "svg:path"
        },
        properties: {
            vectors: {
                value: []
            },
            d: {
                value: "M 0 0",
                cascade: {
                    source: "vectors",
                    update: function (vectors) {
                        if (vectors && vectors.length) {
                            var v0, v1, rslt = "M 0 0";
                            do {
                                v = vectors.shift();
                                rslt += " l " + v[0] + " " + v[1];
                            } while (vectors.length);
                            this.d(rslt);
                        }
                    }
                },
                watcher: function (pname, pvalue) {
                    this.resolve("@root").set("d", pvalue);
                }
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, window);
