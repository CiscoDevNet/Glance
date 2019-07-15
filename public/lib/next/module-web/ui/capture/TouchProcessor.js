(function (nx) {
    /**
     * Touch events:
     * touchsessionstart (first touch point)
     * touchsessionzoom (touch 2 point and move)
     * touchsessionhover (touch and keep)
     * touchsessionopen (double tap)
     * touchsessionend (last touch point and no more in a while)
     *
     * @class TouchProcessor
     * @namespace nx.ui.capture
     */
    var EXPORT = nx.define("nx.ui.capture.TouchProcessor", {
        properties: {
            msDouble: 200,
            msHold: 400, // milliseconds of keeping touched
            event: {},
            handlers: {},
            matchers: {
                value: function () {
                    return [
                        new nx.ui.capture.touch.HoldMatcher(this), // matcher of hold event
                        new nx.ui.capture.touch.TapMatcher(this), // matcher of tap event
                        new nx.ui.capture.touch.DragMatcher(this), // matcher of dragging
                        new nx.ui.capture.touch.TransformMatcher(this), // matcher of zooming
                        new nx.ui.capture.touch.ClearMatcher(this) // default matcher of release
                    ];
                }
            },
            session: {
                watcher: function (pname, pvalue, poldvalue) {
                    this.release("session");
                    if (pvalue) {
                        this.retain("session", pvalue.on("update", this.updateSession.bind(this)));
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
                    this.session(new nx.ui.capture.touch.Session());
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
                this.session().release();
                this.session(null);
            },
            trigger: function (name, evt, delay, delayCallback) {
                // call the notifier
                if (delay) {
                    return nx.timer(delay, function () {
                        this.triggerAction(name, evt);
                        delayCallback && delayCallback();
                    }.bind(this));
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
                handler.fire(name, evt);
            },
            updateSession: function () {
                var session = this.session();
                nx.each(this.matchers(), function (matcher) {
                    // release if any previous states occurs
                    matcher.release("affect");
                    // try match the session
                    if (matcher.match(session)) {
                        var result = matcher.affect(session);
                        if (result) {
                            matcher.retain("affect", result);
                        }
                        if (result === false) {
                            return false;
                        }
                    }
                });
            }
        }
    });
})(nx);
