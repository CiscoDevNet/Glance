(function (nx) {
    var square = nx.math.square;
    /**
     * @class MouseProcessor
     * @namespace nx.ui.capture
     */
    var EXPORT = nx.define("nx.ui.capture.MouseProcessor", {
        properties: {
            msHold: 400,
            event: {},
            track: {},
            handler: {}
        },
        methods: {
            enable: function (target) {
                var instance = this;
                target.addEventListener("mousedown", function (evt) {
                    instance.attach(evt);
                }, true);
                target.addEventListener("mousemove", function (evt) {
                    instance.move(evt);
                }, true);
                target.addEventListener("mouseup", function (evt) {
                    instance.end(evt);
                }, true);
                target.addEventListener("mousedown", function (evt) {
                    instance.detach(evt);
                });
            },
            attach: function (evt) {
                this.handler(null);
                this.event(evt);
                if (evt.capture) {
                    this._lastCapture = evt.capture;
                }
                evt.capture = this.capture.bind(this);
            },
            detach: function (evt) {
                if (this._lastCapture) {
                    evt.capture = this._lastCapture;
                    delete this._lastCapture;
                } else {
                    delete evt.capture;
                }
            },
            capture: function (handler) {
                // make sure only one handler can capture the "drag" event
                var captured, evt = this.event();
                if (handler && evt && evt.button === 0 && !this.handler()) {
                    this.handler(handler);
                    // track and data
                    var track = [];
                    this.track(track);
                    this.track().push([evt.clientX, evt.clientY]);
                    this._timer = setTimeout(this.hold.bind(this), this.msHold());
                    return true;
                }
                return false;
            },
            hold: function () {
                var handler = this.handler();
                var evt = this.event();
                if (this.isTrackLong()) {
                    if (!evt.capturedata) {
                        evt.capturedata = this._makeDragData(evt);
                    }
                    this._call(handler, "capturehold", evt);
                }
                clearTimeout(this._timer);
            },
            move: function (evt) {
                var handler = this.handler();
                if (handler) {
                    // TODO drag start event
                    // append point to the event
                    evt.capturedata = this._makeDragData(evt);
                    // fire events
                    this._call(handler, "capturedrag", evt);
                }
            },
            end: function (evt) {
                var handler = this.handler();
                if (handler) {
                    // append to the event
                    evt.capturedata = this._makeDragData(evt);
                    // fire events
                    this._call(handler, "capturedragend", evt);
                    if (this.isTrackLong()) {
                        this._call(handler, "capturetap", evt);
                    }
                    this._call(handler, "captureend", evt);
                }
                // clear status
                this.handler(null);
                this.track(null);
                this.event(null);
                clearTimeout(this._timer);
            },
            cancel: function () {
                // TODO cancel logic
            },
            isTrackLong: function () {
                var track = this.track();
                if (!track) {
                    return false;
                }
                var origin = track[0];
                return nx.each(track, function (position) {
                    if (square(position[0] - origin[0]) + square(position[1] - origin[1]) > 3 * 3) {
                        return false;
                    }
                });
            },
            _call: function (handler, name, evt) {
                if (handler[name] && typeof handler[name] === "function") {
                    var callback = handler[name].call(handler);
                    if (callback && typeof callback === "function") {
                        return callback(evt);
                    }
                } else if (nx.is(handler, nx.ui.Element)) {
                    handler.fire(name, evt);
                }
            },
            _makeDragData: function (evt) {
                var track = this.track();
                var current = [evt.clientX, evt.clientY],
                    origin = track[0],
                    last = track[track.length - 1];
                current.time = evt.timeStamp;
                track.push(current);
                if (!origin) {
                    origin = last = current.slice();
                }
                // TODO make sure the data is correct when target applied a matrix
                return {
                    target: this.handler(),
                    origin: origin,
                    position: current,
                    offset: [current[0] - origin[0], current[1] - origin[1]],
                    delta: [current[0] - last[0], current[1] - last[1]],
                    // TODO make it readonly
                    track: track
                };
            }
        }
    });
})(nx);
