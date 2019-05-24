(function(nx) {
    /**
     * @class Use
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.Use", nx.lib.svg.Node, {
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
            init: function() {
                this.inherited("use");
            }
        }
    });
})(nx);
