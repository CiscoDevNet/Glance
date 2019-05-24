(function (nx) {
    /**
     * @class HyperLink
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.HyperLink", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("a");
            }
        }
    });
})(nx);
