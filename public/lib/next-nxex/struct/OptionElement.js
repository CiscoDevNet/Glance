(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class OptionElement
     * @namespace nxex.struct
     */
    var EXPORT = nx.define("nxex.struct.OptionElement", nx.ui.Component, {
        view: {},
        methods: {
            init: function (options) {
                this.inherited();
                this.sets(options);
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
