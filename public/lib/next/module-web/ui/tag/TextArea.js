(function (nx) {
    /**
     * @class TextArea
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.TextArea", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("textarea");
            }
        }
    });
})(nx);
