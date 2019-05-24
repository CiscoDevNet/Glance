(function (nx) {

    var timer = (function () {
        var req = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
        var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
        return function (callback) {
            var timing, cb, running = true;
            cb = function () {
                if (running) {
                    callback();
                    cancel(timing);
                    timing = req(cb);
                }
            };
            timing = req(cb);
            return {
                release: function () {
                    cancel(timing);
                    running = false;
                }
            };
        };
    })();

    var EXPORT = nx.define("glance.common.ExpertMovementManager", {
        properties: {
            mapMaskUrl: {
                dependencies: "global.app.service.mapName",
                value: function (name) {
                    if (name) {
                        return "map/" + name + "-mask-quarter.png";
                    }
                }
            },
            mapMaskScale: 0.25,
            finderProvider: {
                dependencies: "mapMaskUrl",
                async: true,
                value: function (property, mapMaskUrl) {
                    if (!property.get()) {
                        property.set(new glance.common.map.PathFinderProvider({
                            maskPixelProcessor: function (pixel) {
                                return pixel[3] ? 0 : 1;
                            }
                        }));
                    }
                    property.get().maskUrl(mapMaskUrl);
                }
            },
            finder: {
                dependencies: "finderProvider.finder"
            },
            cache: function () {
                return {
                    count: 0,
                    movements: {}
                };
            }
        },
        methods: {
            init: function (options) {
                this.inherited(options);
                var cache = this.cache();
                // create the timer
                this.timer = function () {
                    var movements = cache.movements;
                    var id, movement, point;
                    var scale = this.mapMaskScale();
                    for (id in movements) {
                        movement = movements[id];
                        if (movement && movement.path.length) {
                            point = movement.path.shift();
                            movement.expert.position([point[0] / scale, point[1] / scale]);
                            cache.count--;
                        }
                    }
                    this.checkTimer();
                }.bind(this);
            },
            setPosition: function (expert, coordinate) {
                var immediate = false;
                var res = this.watch("finder", function (name, finder) {
                    if (finder) {
                        scale = this.mapMaskScale();
                        coordinate = finder.getNearestAvailablePoint([
                            Math.floor(coordinate[0] * scale),
                            Math.floor(coordinate[1] * scale)
                        ]);
                        expert.position([coordinate[0] / scale, coordinate[1] / scale]);
                        immediate = true;
                        res && res.release();
                    }
                }.bind(this));
                if (immediate) {
                    res.release();
                }
            },
            setMovement: function (expert, coordinate) {
                var scale = this.mapMaskScale();
                if (!this.finder()) {
                    expert.position(coordinate);
                } else {
                    var finder = this.finder();
                    this.clearMovement(expert);
                    // find the new path
                    var start, end;
                    start = finder.getNearestAvailablePoint([
                        Math.floor(expert.position()[0] * scale),
                        Math.floor(expert.position()[1] * scale)
                    ]);
                    end = finder.getNearestAvailablePoint([
                        Math.floor(coordinate[0] * scale),
                        Math.floor(coordinate[1] * scale)
                    ]);
                    var cache = this.cache();
                    var id = nx.path(expert, "id");
                    finder.getPath(start, end, function (path) {
                        if (path.length > 1) {
                            cache.movements[id] = {
                                expert: expert,
                                path: path.slice(1)
                            };
                            cache.count += path.length;
                            this.checkTimer();
                        }
                    }.bind(this));
                }
            },
            clearMovement: function (expert) {
                var cache = this.cache();
                var id = nx.path(expert, "id");
                var lastMovement = cache.movements[id];
                // stop current movement
                cache.movements[id] = null;
                cache.count -= lastMovement ? lastMovement.path.length : 0;
                this.checkTimer();
            },
            checkTimer: function () {
                var cache = this.cache();
                if (this._timer_resource && cache.count === 0) {
                    this.release("timer_resouce");
                    this._timer_resource = null;
                } else if (cache.count && !this._timer_resource) {
                    this._timer_resource = timer(this.timer);
                    this.retain("timer_resouce", this._timer_resource);
                }
            }
        }
    });
})(nx);
