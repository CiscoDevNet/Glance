(function (nx) {

    // short cuts of functions

    /**
     * @class Path
     * @extends nx.lib.svg.Node
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Path", nx.lib.svg.Node, {
        methods: {
            init: function () {
                this.inherited("path");
            }
        },
        properties: {
            vectors: {
                value: []
            },
            d: {
                dependencies: "vectors",
                value: function (vectors) {
                    if (vectors && vectors.length) {
                        var v0, v1, rslt = "M 0 0";
                        do {
                            v = vectors.shift();
                            rslt += " l " + v[0] + " " + v[1];
                        } while (vectors.length);
                        return rslt;
                    }
                    return this._d || "M 0 0";
                },
                watcher: function (pname, pvalue) {
                    this.setAttribute("d", pvalue);
                }
            }
        }
    });
})(nx);
