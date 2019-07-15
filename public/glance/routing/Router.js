(function(nx) {
    var EXPORT = nx.define("glance.routing.Router", {
        properties: {
            transparent: 0x00000000,
            image: null,
            scaleX: 1,
            scaleY: 1,
            thread: {
                set: function() {
                    throw new Error("Thread is readonly for router.");
                }
            }
        },
        methods: {
            init: function(options) {
                this.inherited();
                options && nx.sets(this, options);
                var thread = new nx.lib.thread.Thread("glance/routing/thread-router.js");//
                this._thread = thread;
                this.notify("thread");
                this.retain(nx.Object.cascade(this, "image, transparent", function(image, transparent) {
                    if (image && (typeof transparent === "function" || typeof transparent === "number")) {
                        var map = EXPORT.getMask(image, transparent);
                        thread.send({
                            type: "init",
                            map: map
                        });
                    }
                }));
            },
            getNearestPoint: function(point, callback) {//
                var resources;
                var scaleX, scaleY;
                scaleX = this.scaleX(), scaleY = this.scaleY();
                var id = nx.uuid(true);
                resources = this.thread().on("message", function(message) {
                    if (message.id === id) {
                        callback([
                            Math.floor(message.position[0] / scaleX),
                            Math.floor(message.position[1] / scaleY)
                        ]);
                    }
                });
                this.thread().send({
                    id: id,
                    type: "settle",
                    position: [
                        Math.floor(point[0] * scaleX),
                        Math.floor(point[1] * scaleY)
                    ]
                });
                return resources;
            },
            getRoute: function(source, target, callback) {
                var resources;
                var scaleX, scaleY;
                scaleX = this.scaleX(), scaleY = this.scaleY();
                var id = nx.uuid(true);
                resources = this.thread().on("message", function(sender, message) {
                    if (message.id === id) {
                        var route = message.route.map(function(position) {
                            return [
                                Math.floor(position[0] / scaleX),
                                Math.floor(position[1] / scaleY)
                            ];
                        });
                        if (route && route.length > 2) {
                            // simplify the route
                            route = EXPORT.simplify(route);
                            callback(route);
                        }
                    }
                });
                this.thread().send({
                    id: id,
                    type: "route",
                    source: [
                        Math.floor(source[0] * scaleX),
                        Math.floor(source[1] * scaleY)
                    ],
                    target: [
                        Math.floor(target[0] * scaleX),
                        Math.floor(target[1] * scaleY)
                    ]
                });
                return resources;
            }
        },
        statics: {
            simplify: function(route) {
                var TURN = 0.75;
                var cosine = function(v1, v2) {
                    var cos = (v1[0] * v2[0] + v1[1] * v2[1]) / Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]) / Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
                    return cos;
                };
                // copy the route
                route = route.slice();
                var i, p, cos, vec1, vec2;
                // TODO better algorithm
                for (p = 1, vec1 = [route[1][0] - route[0][0], route[1][1] - route[0][1]]; p < route.length - 1;) {
                    vec2 = [route[p + 1][0] - route[p][0], route[p + 1][1] - route[p][1]];
                    cos = cosine(vec1, vec2);
                    if (cos > TURN) {
                        vec1[0] += vec2[0];
                        vec1[1] += vec2[1];
                        route.splice(p, 1);
                    } else {
                        p++;
                        vec1 = vec2;
                    }
                }
                return route;
            },
            getMask: function(image, transparent) {
                var data, map;
                // draw image on canvas
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                canvas.width = image.width;
                canvas.height = image.height;
                context.drawImage(image, 0, 0);
                // get map data
                data = Array.prototype.slice.call(context.getImageData(0, 0, image.width, image.height).data);
                // algorithm
                var i, n, w4, pixel, p, row, r;
                p = r = 0, w4 = image.width * 4, n = data.length, map = [];
                for (i = 0; i < n; i += 4, p++) {
                    if (i % w4 === 0) {
                        row = map[r++] = [];
                        p = 0;
                    }
                    pixel = (data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | (data[i + 3]);
                    if (typeof transparent === "function") {
                        row[p] = transparent(pixel) ? 1 : 0;
                    } else {
                        row[p] = (pixel === transparent) ? 1 : 0;
                    }
                }
                return map;
            }
        }
    });
})(nx);
