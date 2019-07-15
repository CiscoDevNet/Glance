(function (nx, ui, toolkit, annotation, global) {
    var Vector = nxex.geometry.Vector;
    var Math = nxex.geometry.Math;
    /**
     * Touch events.
     *
     * @class HoldMatcher
     * @namespace nxex.struct.capture.touch
     */
    var EXPORT = nx.define("nxex.struct.capture.touch.HoldMatcher", nxex.struct.capture.touch.Matcher, {
        properties: {
            timer: null
        },
        methods: {
            match: function (session) {
                // only touch start happened
                return session.timeline().length === 1;
            },
            affect: function (session) {
                var self = this;
                var processor = this.processor();
                var evt = session.lastEvent();
                evt.capturedata = {
                    position: session.touches()[0].track[0]
                };
                this._timer = processor.trigger("capturehold", session.lastEvent(), processor.msHold());
            },
            release: function () {
                clearTimeout(this._timer);
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
