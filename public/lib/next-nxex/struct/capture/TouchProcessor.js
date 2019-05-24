(function (nx, ui, toolkit, annotation, global) {
    /**
     * Touch events:
     * touchsessionstart (first touch point)
     * touchsessionzoom (touch 2 point and move)
     * touchsessionhover (touch and keep)
     * touchsessionopen (double tap)
     * touchsessionend (last touch point and no more in a while)
     *
     * @class TouchProcessor
     * @namespace nxex.struct.capture
     */
    var EXPORT = nx.define("nxex.struct.capture.TouchProcessor", nxex.Observable, {
        properties: {
            msDouble: 200,
            msHold: 400, // milliseconds of keeping touched
            event: {},
            handlers: {},
            matchers: {
                value: function () {
                    return [
                        new nxex.struct.capture.touch.HoldMatcher(this), // matcher of hold event
                        new nxex.struct.capture.touch.TapMatcher(this), // matcher of tap event
                        new nxex.struct.capture.touch.DragMatcher(this), // matcher of dragging
                        new nxex.struct.capture.touch.TransformMatcher(this), // matcher of zooming
                        new nxex.struct.capture.touch.ClearMatcher(this) // default matcher of release
                    ];
                }
            },
            session: {
                watcher: function (propertyName, propertyValue) {
                    this._lastSessionListener && this._lastSessionListener.release();
                    if (propertyValue) {
                        this._lastSessionListener = propertyValue.on("update", this.updateSession, this);
                    } else {
                        this._lastSessionListener = null;
                    }
                }
            }
        },
        methods: {
            enable: function (target) {
                var instance = this;
                target.addEventListener("touchstart", function (evt) {
                    instance.attach(evt);
                }, true);
                target.addEventListener("touchstart", function (evt) {
                    instance.detach(evt);
                });
                target.addEventListener("touchmove", function (evt) {
                    instance.update(evt);
                }, true);
                target.addEventListener("touchend", function (evt) {
                    instance.update(evt);
                }, true);
                target.addEventListener("touchcancel", function (evt) {
                    instance.update(evt);
                }, true);
            },
            attach: function (evt) {
                this.event(evt);
                // add capture on event
                if (evt.capture) {
                    this._lastCapture = evt.capture;
                }
                evt.capture = this.capture.bind(this);
                // start new session if not exists
                if (!this.session()) {
                    this.session(new nxex.struct.capture.touch.Session());
                }
            },
            detach: function (evt) {
                // clear capture from event
                if (this._lastCapture) {
                    evt.capture = this._lastCapture;
                    delete this._lastCapture;
                } else {
                    delete evt.capture;
                }
                // update session with event
                this.update(evt);
            },
            capture: function (handler, names) {
                var handlers = this.handlers();
                // initial handlers if not exists
                if (!handlers) {
                    handlers = {};
                    this.handlers(handlers);
                    this.event().preventDefault();
                }
                // make sure only one handler can capture the "drag" event
                var success = true;
                names = typeof names === "string" ? names.replace(/\s/g, "").split(",") : names;
                nx.each(names, function (name) {
                    if (name === "end") {
                        // capture end belongs to all handlers
                        handlers["captureend"] = handlers["captureend"] || [];
                        handlers["captureend"].push(handler);
                    } else {
                        name = "capture" + name;
                        if (handler && !handlers[name]) {
                            handlers[name] = handler;
                        }
                    }
                });
                return success;
            },
            update: function (evt) {
                // update session with event
                if (this.session()) {
                    this.session().update(evt);
                    if (this.handlers()) {
                        evt.preventDefault();
                    }
                }
            },
            reset: function () {
                this.handlers(null);
                this.session(null);
            },
            trigger: function (name, evt, delay, delayCallback) {
                // create the notifier
                var notifier = function () {};
                // call the notifier
                if (delay) {
                    return setTimeout(function () {
                        this.triggerAction(name, evt);
                        delayCallback && delayCallback();
                    }.bind(this), delay);
                } else {
                    this.triggerAction(name, evt);
                    delayCallback && delayCallback();
                }
            },
            triggerAction: function (name, evt, callback) {
                var self = this;
                var handlers = this.handlers();
                if (name === "captureend") {
                    nx.each(handlers && handlers[name], function (handler) {
                        self.triggerOne(handler, name, evt);
                    });
                } else {
                    if (handlers && handlers[name]) {
                        // check the handler existance
                        self.triggerOne(handlers[name], name, evt);
                    }
                }
            },
            triggerOne: function (handler, name, evt) {
                if (handler[name] && typeof handler[name] === "function") {
                    var callback = handler[name].call(handler);
                    if (callback && typeof callback === "function") {
                        callback(evt);
                    }
                } else if (handler.can(name)) {
                    handler.fire(name, evt);
                }
            },
            updateSession: function () {
                var session = this.session();
                nx.each(this.matchers(), function (matcher) {
                    // release if any previous states occurs
                    matcher.release(session);
                    // try match the session
                    if (matcher.match(session)) {
                        return matcher.affect(session);
                    }
                });
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
