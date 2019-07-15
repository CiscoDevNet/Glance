(function(nx) {
    /**
     * @class Use
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Image", nx.lib.svg.Node, {
        properties: {
            href: {
                watcher: function(pname, pvalue) {
                    if (pvalue) {
                        this.setAttributeNS("http://www.w3.org/1999/xlink", "href", pvalue);
                    }
                }
            }
        },
        methods: {
            init: function(tag) {
                this.inherited("image");
            }
        }
    });
})(nx);
