(function(nx) {
    var BOUND = 2;
    var DEFAULT_AXIS = "y";
    var EXPORT = nx.define("nx.lib.component.Scroller", nx.ui.Element, {
        view: {
            cssclass: "scroller",
            content: {
                name: "inner"
            },
            capture: {
                start: "handler_dragstart",
                drag: "handler_dragmove",
                dragend: "handler_dragend"
            },
            events: {
                axis: "option_axis"
            }
        },
        properties: {
            pageSize: 1, // not paging
            axis: DEFAULT_AXIS,
            elastic: 2000
        },
        methods: {
            init: function(options) {
                this.inherited();
                nx.sets(this, options);
                this._x = this._y = 0;
            },
            /**
             * Check if scroll is enabled on the given axis.
             */
            isScrollable: function(d) {
                var axis = this.axis() || DEFAULT_AXIS;
                if (arguments.length == 0) {
                    return axis == "x" || axis == "y";
                }
                return d == axis;
            },
            /**
             * Get the scroll limit on the given axis.
             */
            getLimit: function() {
                var axis = this.axis();
                var page, rslt = 0;
                rslt = Math.min(0, this._out[axis] - this._in[axis]);
                // extend the limit to fit paging
                page = this.pageSize();
                if (rslt && page > 1) {
                    rslt = Math.ceil(rslt / page) * page;
                }
                return rslt;
            },
            /**
             * Consider the inner content's current position, returning the real delta caused by the given mouse delta.
             */
            delta: function(delta) {
                if (!this.isScrollable()) {
                    return 0;
                }
                var axis = this.axis();
                var w = this.getLimit(axis);
                var x = this["_" + axis];
                if (x > 0) {
                    if (x * BOUND + delta > 0) {
                        return delta / BOUND;
                    } else if (x * 2 + delta < w) {
                        return (delta - w) / BOUND + w;
                    } else {
                        return x * BOUND + delta - x;
                    }
                } else if ((x - w) < 0) {
                    if ((x - w) * BOUND + delta < 0) {
                        return delta / BOUND;
                    } else if ((x - w) * BOUND + delta > -w) {
                        return (delta + w) / BOUND - w;
                    } else {
                        return delta - (BOUND - 1) * (w - x);
                    }
                } else {
                    if (x + delta > 0) {
                        return (delta - x) / 2;
                    } else if (x + delta < w) {
                        return (delta - x + w) / 2;
                    } else {
                        return delta;
                    }
                }
            },
            freemove: function(v) {
                if (!this.isScrollable()) {
                    return false;
                }
                var axis = this.axis();
                var self = this,
                    a, w, x0;
                var delta, time, bezier;
                var xt, v1, t1, t2, x, s;
                a = this.elastic();
                w = this.getLimit();
                x0 = this["_" + axis];
                if (x0 > 0 || x0 < w) {
                    // out of bound
                    delta = (x0 > 0 ? -x0 : w - x0);
                    time = Math.sqrt(Math.abs(delta * 2 / a / BOUND));
                    bezier = "(0.5, 1, 1, 1)";
                } else {
                    time = Math.abs(v / a);
                    delta = v * time / 2;
                    xt = x0 + delta;
                    if (xt <= 0 && xt >= w) {
                        bezier = "(0, 1, 1, 1)";
                    } else {
                        delta = (xt > 0 ? -x0 : w - x0);
                        v1 = (v >= 0 ? 1 : -1) * Math.sqrt(v * v - 2 * a * delta);
                        t1 = Math.abs((v - v1) / a);
                        t2 = Math.abs(v1 / BOUND / a);
                        time = t1 + t2 * 2;
                        x = v1 * t2 / 2;
                        s = delta + x * 2;
                        bezier = "(" + ((t1 + t2) / time) + "," + (s / delta) + "," + ((t1 + t2 * 1.5) / time) + ", 1)";
                    }
                }
                if (time > 1) {
                    time = 1;
                }
                this.animate(time, bezier);
                this["_" + axis] += delta;
                this.translate(this._x, this._y);
                setTimeout(function() {
                    var pg = self.pageSize() || 1;
                    var offset = self["_" + axis];
                    if (offset % pg) {
                        self["_" + axis] = Math.round(offset / pg) * pg;
                        self.animate(0.15, "(0.5, 1, 1, 1)");
                        self.translate(self._x, self._y);
                        setTimeout(function() {
                            self.animate(false);
                        }, 150);
                    } else {
                        self.animate(false);
                    }
                }, time * 1000 + 10);
            },
            option_axis: function() {
                this.reset();
            },
            /**
             * Refresh the current size of inner/outer panels.
             */
            update: function() {
                var inBound = this.inner().getBound();
                var outBound = this.getBound();
                this._in = {
                    x: inBound.width,
                    y: inBound.height
                };
                this._out = {
                    x: outBound.width,
                    y: outBound.height
                };
            },
            /**
             * Reset the scroll position.
             */
            reset: function() {
                this._x = 0;
                this._y = 0;
                this.translate(this._x, this._y);
            },
            fixbound: function() {
                this.update();
                this.freemove(0);
            },
            handler_dragstart: function(self, evt) {
                this.update();
                this.animate(false);
            },
            handler_dragmove: function(self, evt) {
                if (this.isScrollable()) {
                    // get delta
                    var axis = this.axis();
                    this["_" + axis] += this.delta(evt.capturedata.delta[axis == "x" ? 0 : 1]);
                    // do translation
                    this.translate(this._x, this._y);
                }
            },
            handler_dragend: function(self, evt) {
                if (this.isScrollable()) {
                    var v = EXPORT.getSpeed(evt.capturedata.track);
                    var axis = this.axis();
                    this.freemove(v[axis]);
                }
            },
            translate: function(x, y) {
                this.inner().setStyle("transform", "translate(" + x + "px, " + y + "px)");
                this.inner().setStyle("transform", "translate3d(" + x + "px, " + y + "px, 0)");
            },
            /**
             * The switch of animation, using Bezier curve timing function.
             */
            animate: function(seconds, bezier) {
                if (seconds === false) {
                    this.inner().removeStyle("transition-duration");
                    this.inner().removeStyle("transition-timing-function");
                } else {
                    var val = seconds + "s";
                    this.inner().setStyle({
                        "transition-duration": val,
                        "transition-timing-function": "cubic-bezier" + bezier
                    });
                }
            }
        },
        statics: {
            DEFAULT_AXIS: DEFAULT_AXIS,
            getSpeed: function(track) {
                // TODO better algorithm
                var v = {
                    x: (track[track.length - 1][0] - track[0][0]) * 1000 / Math.max(1, track[track.length - 1].time - track[0].time),
                    y: (track[track.length - 1][1] - track[0][1]) * 1000 / Math.max(1, track[track.length - 1].time - track[0].time)
                };
                if (Math.abs(track[track.length - 1][0] - track[0][0]) < 40) {
                    v.x = 0;
                } else if (Math.abs(v.x) < 1200) {
                    v.x = (v.x > 0 ? 1 : -1) * 1200;
                }
                if (Math.abs(track[track.length - 1][1] - track[0][1]) < 40) {
                    v.y = 0;
                } else if (Math.abs(v.y) < 1200) {
                    v.y = (v.y > 0 ? 1 : -1) * 1200;
                }
                if (track[track.length - 1].time - track[0].time > 300) {
                    v.x = v.y = 0;
                }
                return v;
            }
        }
    });
})(nx);
