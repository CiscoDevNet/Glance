(function (nx, ui, toolkit, annotation, global) {
    var Vector = nxex.geometry.Vector;
    var Math = nxex.geometry.Math;
    /**
     * Touch events.
     *
     * @class Session
     * @namespace nxex.struct.capture.touch
     */
    var EXPORT = nx.define("nxex.struct.capture.touch.Session", nxex.Observable, {
        events: ["update"],
        properties: {
            // options
            precisionTime: 200,
            precisionDelta: 5,
            // store
            lastEvent: null,
            // calculation
            count: 0,
            indices: {
                value: function () {
                    return {};
                }
            },
            touches: {
                value: function () {
                    return [];
                }
            },
            timeline: {
                value: function () {
                    return [];
                }
            }
        },
        methods: {
            update: function (evt) {
                var time = evt.timeStamp,
                    changed = false;
                EXPORT.eachTouch(evt, function (touch) {
                    var id = touch.identifier;
                    var position = [touch.clientX, touch.clientY];
                    var ename = evt.type;
                    // FIXME treat touch cancel as touch end
                    ename = (ename === "touchcancel" ? "touchend" : ename);
                    // log the event
                    if (this[ename]) {
                        if (this[ename].call(this, time, id, position) !== false) {
                            changed = true;
                        }
                    }
                }.bind(this));
                if (changed) {
                    this.lastEvent(evt);
                    this.fire("update");
                }
            },
            touchstart: function (time, id, position) {
                // get the touch
                var index, indices = this.indices();
                var touch, touches = this.touches();
                index = indices[id] = touches.length;
                touch = touches[index] = {
                    id: id,
                    index: touches.length,
                    track: [position]
                };
                // increase the count
                this.count(this.count() + 1);
                // update timeline
                var timepiece, timeline = this.timeline();
                if (timeline.length === 1 && Math.approximate(timeline[0].time, time, this.precisionTime())) {
                    timepiece = timeline[0];
                } else {
                    timeline.push(timepiece = {
                        time: time,
                        type: "touchstart",
                        touches: []
                    });
                }
                // update the touches of time piece
                timepiece.touches[index] = touch;
            },
            touchmove: function (time, id, position) {
                // get the touch
                var index, indices = this.indices();
                var touch, touches = this.touches();
                index = indices[id];
                touch = touches[index];
                // ignore for to close touch move
                if (Vector.approximate(touch.track[touch.track.length - 1], position, this.precisionDelta())) {
                    return false;
                }
                touch.track.push(position);
                // update timeline
                var timepiece, timeline = this.timeline();
                timepiece = timeline[timeline.length - 1];
                if (timepiece.type !== "touchmove" || !Math.approximate(timepiece.time, time)) {
                    timeline.push(timepiece = {
                        time: time,
                        type: "touchmove",
                        touches: []
                    });
                }
                // update the touches of time piece
                timepiece.touches[index] = touch;
            },
            touchend: function (time, id) {
                // get the touch
                var index, indices = this.indices();
                var touch, touches = this.touches();
                index = indices[id];
                touch = touches[index];
                // clear
                indices[id] = undefined;
                touch.released = true;
                // increase the count
                this.count(this.count() - 1);
                // update timeline
                var timepiece, timeline = this.timeline();
                timepiece = timeline[timeline.length - 1];
                if (timepiece.type !== "touchend" || !Math.approximate(timepiece.time, time)) {
                    timeline.push(timepiece = {
                        time: time,
                        type: "touchend",
                        touches: []
                    });
                }
                // update the touches of time piece
                timepiece.touches[index] = touch;
            }
        },
        statics: {
            eachTouch: function (evt, callback) {
                var i, n = evt.changedTouches.length;
                for (i = 0; i < n; i++) {
                    if (callback(evt.changedTouches[i], i) === false) {
                        break;
                    }
                }
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
