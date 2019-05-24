(function(nx) {
    /**
     * @class TableHeadCell
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.TableHeadCell", nx.ui.Element, {
        methods: {
            init: function() {
                this.inherited("th");
            }
        }
    });
})(nx);
