(function(nx) {
    var Vector = nx.geometry.Vector;
    var Rectangle = nx.geometry.Rectangle;
    var GeoMath = nx.geometry.Math;
    /**
     * Touch events.
     *
     * @class TransformMatcher
     * @namespace nx.ui.capture.touch
     */
    var EXPORT = nx.define("nx.ui.capture.touch.TransformMatcher", nx.ui.capture.touch.Matcher, {
        properties: {
            origin: null,
            previous: null
        },
        methods: {
            match: function(session) {
                if (EXPORT.isTwoTouch(session)) {
                    if (this.origin()) {
                        return true;
                    }
                    var rect = EXPORT.getRect(session);
                    this.origin(rect);
                    this.previous(rect);
                    return false;
                } else {
                    return false;
                }
            },
            affect: function(session) {
                var processor = this.processor();
                var event = session.lastEvent();
                event.capturedata = this.makeZoomData(session);
                processor.trigger("capturetransform", event);
                this.previous(EXPORT.getRect(session));
                return {
                    release: function() {
                        var session = this.processor().session();
                        if (!EXPORT.isTwoTouch(session)) {
                            this.origin(null);
                            this.previous(null);
                        }
                    }.bind(this)
                };
            },
            makeZoomData: function(session) {
                var origin = this.origin();
                var previous = this.previous();
                var target = EXPORT.getRect(session);
                var p0 = [(origin[0][0] + origin[1][0]) / 2, (origin[0][1] + origin[1][1]) / 2];
                var pa = [(previous[0][0] + previous[1][0]) / 2, (previous[0][1] + previous[1][1]) / 2];
                var pb = [(target[0][0] + target[1][0]) / 2, (target[0][1] + target[1][1]) / 2];
                return {
                    delta: {
                        origin: pa,
                        target: pb,
                        translate: [pb[0] - pa[0], pb[1] - pa[1]],
                        scale: EXPORT.distance(target) / EXPORT.distance(previous),
                        rotate: EXPORT.angle(target) / EXPORT.angle(previous)
                    },
                    offset: {
                        origin: p0,
                        target: pb,
                        translate: [pb[0] - p0[0], pb[1] - p0[1]],
                        scale: EXPORT.distance(target) / EXPORT.distance(origin),
                        rotate: EXPORT.angle(target) / EXPORT.angle(origin)
                    }
                };
            }
        },
        statics: {
            isTwoTouch: function(session) {
                return session.count() === 2;
            },
            getRect: function(session) {
                var rect = [];
                nx.each(session.touches(), function(touch) {
                    if (!touch.released) {
                        rect.push(touch.track[touch.track.length - 1]);
                    }
                });
                // return
                return rect;
            },
            distance: function(rect) {
                var p0 = rect[0];
                var p1 = rect[1];
                var dx = p1[0] - p0[0];
                var dy = p1[1] - p0[1];
                return Math.sqrt(dx * dx + dy * dy);
            },
            angle: function(rect) {
                var p0 = rect[0];
                var p1 = rect[1];
                var dx = p1[0] - p0[0];
                var dy = p1[1] - p0[1];
                return Math.atan(dy, dx);
            }
        }
    });
})(nx);
