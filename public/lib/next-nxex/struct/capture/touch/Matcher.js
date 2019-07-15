(function (nx, ui, toolkit, annotation, global) {
    var Vector = nxex.geometry.Vector;
    var Math = nxex.geometry.Math;
    /**
     * Touch events.
     *
     * @class Matcher
     * @namespace nxex.struct.capture.touch
     */
    var EXPORT = nx.define("nxex.struct.capture.touch.Matcher", nxex.Observable, {
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
            affect: nx.idle,
            release: nx.idle
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
