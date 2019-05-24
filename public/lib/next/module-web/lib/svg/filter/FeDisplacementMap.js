(function (nx) {
    /**
     * @class FeDisplacementMap
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeDisplacementMap", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feDisplacementMap", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
