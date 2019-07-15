(function (nx, ui, toolkit, annotation, global) {
    var Vector = nxex.geometry.Vector;
    var Rectangle = nxex.geometry.Rectangle;
    var GeoMath = nxex.geometry.Math;
    /**
     * Touch events.
     *
     * @class DragMatcher
     * @namespace nxex.struct.capture.touch
     */
    var EXPORT = nx.define("nxex.struct.capture.touch.DragMatcher", nxex.struct.capture.touch.Matcher, {
        properties: {
            touch: null,
            origin: null,
            ending: false
        },
        methods: {
            match: function (session) {
                if (EXPORT.isOneTouch(session)) {
                    if (this.touch()) {
                        return true;
                    }
                    var touch = EXPORT.getTouch(session);
                    this.touch(touch);
                    this.origin(touch.track.length - 1);
                    return false;
                } else {
                    if (this.touch()) {
                        this.ending(true);
                        return true;
                    }
                    return false;
                }
            },
            affect: function (session) {
                var processor = this.processor();
                var ename = this.ending() ? "capturedragend" : "capturedrag";
                var event = session.lastEvent();
                event.capturedata = this.makeZoomData(this.touch().track);
                processor.trigger(ename, event);
                if (this.ending()) {
                    this.touch(null);
                    this.ending(false);
                }
            },
            makeZoomData: function (track) {
                var origin = track[this.origin()];
                var target = track[track.length - 1];
                var previous = track[Math.max(this.origin(), track.length - 2)];
                return {
                    position: target.slice(),
                    origin: origin.slice(),
                    previous: previous.slice(),
                    delta: [target[0] - previous[0], target[1] - previous[1]],
                    offset: [target[0] - origin[0], target[1] - origin[1]],
                    track: track.slice(this.origin())
                };
            }
        },
        statics: {
            isOneTouch: function (session) {
                return session.count() === 1;
            },
            getTouch: function (session) {
                var i, touch, touches = session.touches();
                for (i = 0; i < touches.length; i++) {
                    touch = touches[i];
                    if (!touch.released) {
                        return touch;
                    }
                }
            },
            getTrack: function (session) {
                var i, touch, touches = session.touches();
                for (i = 0; i < touches.length; i++) {
                    touch = touches[i];
                    if (!touch.released) {
                        return touch.track;
                    }
                }
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
