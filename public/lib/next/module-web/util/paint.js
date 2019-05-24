(function(nx) {
    var hasown = Object.prototype.hasOwnProperty;
    var requestAnimationFrame = nx.global.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

    nx.path(nx.global, "nx.util.paint", function(painter) {
        var resources = new nx.Object();
        var callback = function() {
            var now = nx.date.now();
            resources.release("recursive");
            resources.retain("recursive", painter(now));
            id = requestAnimationFrame(callback);
        };
        var id = requestAnimationFrame(callback);
        resources.retain({
            release: function() {
                cancelAnimationFrame(id);
                resources.release("recursive");
            }
        });
        return resources;
    });

    nx.path(nx.global, "nx.util.paint.animate", (function() {

        var Runtime, Animation;
        var painting, map, runtimes;
        map = new nx.Map();
        runtimes = new nx.List();

        map.monitor(function(target, runtime) {
            runtime.start(nx.date.now());
        });

        runtimes.monitorContaining(function(runtime) {
            var target = runtime.animation().target();
            if (!map.get(target)) {
                map.set(target, runtime);
            }
            return function() {
                if (runtime === map.get(target)) {
                    var next = runtimes.find(function(item) {
                        return item.animation().target() === target;
                    });
                    if (next) {
                        map.set(target, next);
                    } else {
                        map.remove(target);
                    }
                }
            };
        });

        runtimes.watch("length", function(pname, length) {
            if (length) {
                painting = painting || nx.util.paint(function() {
                    var now = nx.date.now();
                    var map = new nx.Map();
                    nx.each(runtimes, function(runtime, index) {
                        var rate;
                        if (runtime.start()) {
                            rate = runtime.getRate(now);
                            if (runtime.draw(rate)) {
                                runtime.stop(now);
                                runtime.end(now);
                                runtime.release();
                            }
                        }
                    });
                });
            } else {
                painting && painting.release();
            }
        });

        Runtime = nx.define({
            properties: {
                animation: null,
                start: 0,
                stop: 0,
                end: 0,
                duration: 0,
                timingFunction: "linear",
                iterationCount: 1,
                direction: "normal" // "alternate"
            },
            methods: {
                init: function(options) {
                    this.inherited();
                    nx.sets(this, options);
                },
                getRate: function(now) {
                    now = now || nx.date.now();
                    var func, timingFunction = this.timingFunction() || nx.identity;
                    switch (timingFunction) {
                        case "linear":
                            func = nx.identity;
                            break;
                        case "ease":
                            // TODO etc.
                            break;
                    }
                    return Math.max(func((now - this.start()) / this.duration()), 0);
                },
                draw: function(rate) {
                    rate = rate >= 0 ? rate : this.getRate();
                    var target = this.animation().target();
                    var state0 = this.animation().state0();
                    var state1 = this.animation().state1();
                    var direction = this.direction();
                    var iterationCount = this.iterationCount();
                    var completed = false;
                    if (iterationCount === "infinite") {
                        rate = rate - Math.floor(rate);
                    } else {
                        if (rate > iterationCount) {
                            rate = 1;
                            completed = true;
                        }
                    }
                    if (direction === "alternate") {
                        rate = 1 - rate;
                    }
                    nx.each(state1, function(v1, path) {
                        var v, v0 = state0[path];
                        if (typeof v0 === "number") {
                            nx.path(target, path, v1 * rate + v0 * (1 - rate));
                        } else if (nx.is(v0, Array)) {
                            v = [];
                            nx.each(v0, function(value, idx) {
                                v[idx] = v1[idx] * rate + v0[idx] * (1 - rate);
                            });
                            nx.path(target, path, v);
                        } else {
			    // TODO more
			}
                    });
                    return completed;
                }
            }
        });

        Animation = nx.define({
            properties: {
                target: null,
                state0: {
                    value: function() {
                        return {};
                    }
                },
                state1: {
                    value: function() {
                        return {};
                    }
                }
            },
            methods: {
                init: function(target) {
                    this.inherited();
                    this.target(target);
                },
                reset: function() {
                    var target = this.target();
                    var state0 = this.state0();
                    var state1 = this.state1();
                    nx.each(state1, function(value, path) {
                        state0[path] = nx.path(target, path);
                    });
                },
                set: function(settings, prefix) {
                    prefix = prefix ? prefix + "." : "";
                    var target = this.target();
                    var state0 = this.state0();
                    var state1 = this.state1();
                    nx.each(settings, function(value, key) {
                        if (typeof key === "string") {
                            if (typeof value === "number") {
                                if (!hasown.call(state0, prefix + key)) {
                                    state0[prefix + key] = nx.path(target, prefix + key);
                                }
                                state1[prefix + key] = value;
                            } else if (nx.is(value, Array)) {
                                if (!hasown.call(state0, prefix + key)) {
                                    state0[prefix + key] = nx.path(target, prefix + key);
                                }
                                state1[prefix + key] = value;
                            } else {
                                this.set(value, prefix + key);
                            }
                        }
                    }.bind(this));
                },
                start: function(duration, timingFunction, iterationCount, direction) {
                    // variable-arguments
                    // default: 1000, "linear", 0, 1, "normal"
                    if (typeof duration === "number") {
                        if (timingFunction === "alternate" || timingFunction === "normal") {
                            direction = timingFunction;
                            iterationCount = 1;
                            timingFunction = "linear";
                        } else {
                            if (typeof timingFunction !== "string" && typeof timingFunction !== "function") {
                                direction = iterationCount;
                                iterationCount = timingFunction;
                                timingFunction = "linear";
                            }
                            if (typeof iterationCount !== "number" && isNaN(iterationCount * 1)) {
                                direction = iterationCount === "alternate" ? "alternate" : "normal";
                                iterationCount = 1;
                            } else {
                                iterationCount = iterationCount || 1;
                                direction = direction === "alternate" ? "alternate" : "normal";
                            }
                        }
                    } else {
                        duration = duration || {};
                        direction = duration.direction === "alternate" ? "alternate" : "normal";
                        iterationCount = duration.iterationCount || 1;
                        timingFunction = duration.timingFunction || "linear";
                        duration = duration.duration || 1000;
                    }
                    var runtime = new Runtime({
                        animation: this,
                        duration: duration,
                        timingFunction: timingFunction,
                        iterationCount: iterationCount,
                        direction: direction
                    });
                    runtime.retain({
                        release: function() {
                            runtime.stop(nx.date.now());
                            runtimes.remove(runtime);
                        }
                    });
                    runtimes.push(runtime);
                    return runtime;
                }
            }
        });

        return function(target, callback) {
            var animation = new Animation(target);
            callback(animation);
            return animation;
        };
    })());

})(nx);
