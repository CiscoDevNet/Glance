(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class MouseProcessor
     * @namespace nxex.struct.capture
     */
    var EXPORT = nx.define("nxex.struct.capture.MouseProcessor", nx.Observable, {
        properties: {
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
                var evt = this.event(),
                    captured;
                if (handler && evt && evt.button === 0 && !this.handler()) {
                    this.handler(handler);
                    // track and data
                    var track = [];
                    this.track(track);
                    this.track().push([evt.clientX, evt.clientY]);
                    return true;
                }
                return false;
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
                    if (evt.capturedata.track.length <= 2) {
                        this._call(handler, "capturetap", evt);
                    }
                    this._call(handler, "captureend", evt);
                }
                // clear status
                this.handler(null);
                this.track(null);
                this.event(null);
            },
            cancel: function () {
                // TODO cancel logic
            },
            _call: function (handler, name, evt) {
                if (handler[name] && typeof handler[name] === "function") {
                    var callback = handler[name].call(handler);
                    if (callback && typeof callback === "function") {
                        return callback(evt);
                    }
                } else if (handler.can(name)) {
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
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
