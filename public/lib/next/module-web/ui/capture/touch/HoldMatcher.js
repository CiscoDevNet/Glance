(function (nx) {
    var Vector = nx.geometry.Vector;
    var Math = nx.geometry.Math;
    /**
     * Touch events.
     *
     * @class HoldMatcher
     * @namespace nx.ui.capture.touch
     */
    var EXPORT = nx.define("nx.ui.capture.touch.HoldMatcher", nx.ui.capture.touch.Matcher, {
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
                return processor.trigger("capturehold", session.lastEvent(), processor.msHold());
            }
        }
    });
})(nx);
