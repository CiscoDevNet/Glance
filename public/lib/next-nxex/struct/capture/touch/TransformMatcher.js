(function (nx, ui, toolkit, annotation, global) {
    var Vector = nxex.geometry.Vector;
    var Rectangle = nxex.geometry.Rectangle;
    var GeoMath = nxex.geometry.Math;
    /**
     * Touch events.
     *
     * @class TransformMatcher
     * @namespace nxex.struct.capture.touch
     */
    var EXPORT = nx.define("nxex.struct.capture.touch.TransformMatcher", nxex.struct.capture.touch.Matcher, {
        properties: {
            origin: null,
            previous: null
        },
        methods: {
            match: function (session) {
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
            affect: function (session) {
                var processor = this.processor();
                var event = session.lastEvent();
                event.data = this.makeZoomData(session);
                processor.trigger("capturetransform", event);
                this.previous(EXPORT.getRect(session));
            },
            release: function (session) {
                if (!EXPORT.isTwoTouch(session)) {
                    this.origin(null);
                    this.previous(null);
                }
            },
            makeZoomData: function (session) {
                var origin = this.origin();
                var previous = this.previous();
                var target = EXPORT.getRect(session);
                return {
                    delta: {
                        origin: [(previous[0][0] + previous[1][0]) / 2, (previous[0][1] + previous[1][1]) / 2],
                        target: [(target[0][0] + target[1][0]) / 2, (target[0][1] + target[1][1]) / 2],
                        scale: EXPORT.distance(target) / EXPORT.distance(previous),
                        rotate: EXPORT.angle(target) / EXPORT.angle(previous)
                    },
                    offset: {
                        origin: [(origin[0][0] + origin[1][0]) / 2, (origin[0][1] + origin[1][1]) / 2],
                        target: [(target[0][0] + target[1][0]) / 2, (target[0][1] + target[1][1]) / 2],
                        scale: EXPORT.distance(target) / EXPORT.distance(origin),
                        rotate: EXPORT.angle(target) / EXPORT.angle(origin)
                    }
                };
            }
        },
        statics: {
            isTwoTouch: function (session) {
                return session.count() === 2;
            },
            getRect: function (session) {
                var rect = [];
                nx.each(session.touches(), function (touch) {
                    if (!touch.released) {
                        rect.push(touch.track[touch.track.length - 1]);
                    }
                });
                // return
                return rect;
            },
            distance: function (rect) {
                var p0 = rect[0];
                var p1 = rect[1];
                var dx = p1[0] - p0[0];
                var dy = p1[1] - p0[1];
                return Math.sqrt(dx * dx + dy * dy);
            },
            angle: function (rect) {
                var p0 = rect[0];
                var p1 = rect[1];
                var dx = p1[0] - p0[0];
                var dy = p1[1] - p0[1];
                return Math.atan(dy, dx);
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
