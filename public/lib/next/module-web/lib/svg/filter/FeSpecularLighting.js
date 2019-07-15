(function (nx) {
    /**
     * @class FeSpecularLighting
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeSpecularLighting", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feSpecularLighting", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
