(function(nx) {
    /**
     * @class Select
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.Select", nx.ui.Element, {
        methods: {
            init: function() {
                this.inherited("select");
            },
            focus: function() {
                return this.dom().focus();
            },
            blur: function() {
                return this.dom().blur();
            }
        }
    });
})(nx);
