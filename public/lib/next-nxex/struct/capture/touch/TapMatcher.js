(function (nx, ui, toolkit, annotation, global) {
    var Vector = nxex.geometry.Vector;
    var Math = nxex.geometry.Math;
    /**
     * Touch events.
     *
     * @class TapMatcher
     * @namespace nxex.struct.capture.touch
     */
    var EXPORT = nx.define("nxex.struct.capture.touch.TapMatcher", nxex.struct.capture.touch.Matcher, {
        methods: {
            match: function (session) {
                // only touch start happened
                return session.count() === 0 && session.timeline().length === 2 && session.timeline()[1].type === "touchend";
            },
            affect: function (session) {
                var processor = this.processor();
                var evt = session.lastEvent();
                evt.capturedata = {
                    position: session.touches()[0].track[0]
                };
                processor.trigger("capturetap", evt);
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
