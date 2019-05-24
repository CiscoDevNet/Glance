(function (nx) {
    var Vector = nx.geometry.Vector;
    var Math = nx.geometry.Math;
    /**
     * Touch events.
     *
     * @class Matcher
     * @namespace nx.ui.capture.touch
     */
    var EXPORT = nx.define("nx.ui.capture.touch.Matcher", {
        properties: {
            processor: null
        },
        methods: {
            init: function (processor) {
                this.inherited();
                this.processor(processor);
            },
            match: function (session) {
                return false;
            },
            affect: nx.idle
        }
    });
})(nx);
