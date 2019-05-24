(function (nx) {
    var Vector = nx.geometry.Vector;
    var Math = nx.geometry.Math;
    /**
     * Touch events.
     *
     * @class ClearMatcher
     * @namespace nx.ui.capture.touch
     */
    var EXPORT = nx.define("nx.ui.capture.touch.ClearMatcher", nx.ui.capture.touch.Matcher, {
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
                return processor.trigger("captureend", session.lastEvent(), 0, function () {
                    processor.reset();
                });
            }
        }
    });
})(nx);
