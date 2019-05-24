(function (nx) {
    var Vector = nx.geometry.Vector;
    var Math = nx.geometry.Math;
    /**
     * Touch events.
     *
     * @class TapMatcher
     * @namespace nx.ui.capture.touch
     */
    var EXPORT = nx.define("nx.ui.capture.touch.TapMatcher", nx.ui.capture.touch.Matcher, {
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
})(nx);
