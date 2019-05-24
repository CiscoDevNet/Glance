(function (nx, ui, toolkit, annotation, global) {
    var Vector = nxex.geometry.Vector;
    var Math = nxex.geometry.Math;
    /**
     * Touch events.
     *
     * @class ClearMatcher
     * @namespace nxex.struct.capture.touch
     */
    var EXPORT = nx.define("nxex.struct.capture.touch.ClearMatcher", nxex.struct.capture.touch.Matcher, {
        properties: {
            timer: null
        },
        methods: {
            match: function (session) {
                return session.count() === 0;
            },
            affect: function (session) {
                var self = this;
                var processor = this.processor();
                this._timer = processor.trigger("captureend", session.lastEvent(), 0, function () {
                    processor.reset();
                });
            },
            release: function () {
                this._timer && clearTimeout(this._timer);
                this._timer = null;
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
