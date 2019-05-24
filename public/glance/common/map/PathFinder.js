(function (nx) {
    var EXPORT = nx.define("glance.common.map.PathFinder", {
        properties: {
            map: {}
        },
        methods: {
            init: function (options) {
                this.inherited(options);
                nx.sets(this, options);
                this.pool = new ThreadPool(2);
            },
            getNearestAvailablePoint: function (point) {
                var map = this.map();
                if (map) {
                    var point = this.limited(point);
                    if (map[point[1]][point[0]] != 0) {
                        return point;
                    } else {
                        var row = map.length;
                        var interval = 5;
                        var lastStep = 5;
                        while (lastStep < row) {
                            var startX = point[0] - lastStep;
                            var endX = point[0] + lastStep;
                            while (startX <= endX) {
                                var baseP = Math.round(Math.sqrt(lastStep * lastStep - (startX - point[0]) * (startX - point[0])));
                                var startY1 = point[1] + baseP;
                                var testPoint = this.limited([startX, startY1]);
                                try {
                                    if (map[testPoint[1]][testPoint[0]] != 0)
                                        return testPoint;
                                } catch (ex) {
                                    console.warn("point is (" + testPoint[0] + "," + testPoint[1] + ")");
                                }
                                var startY2 = point[1] - baseP;
                                var testPoint2 = this.limited([startX, startY2]);
                                try {
                                    if (map[testPoint2[1]][testPoint2[0]] != 0)
                                        return testPoint2;
                                } catch (ex) {
                                    console.warn("point is (" + testPoint2[0] + "," + testPoint2[1] + ")");
                                }
                                startX += 1;
                            }
                            lastStep = lastStep + interval;
                        }
                        return null;
                    }
                }
            },
            getPath: function (start, end, callback) {
                var param = {
                    map: this.map(),
                    startPoint: this.limited(start),
                    endPoint: this.limited(end)
                };
                this.pool.run("../../common/map/task.js", param, callback);
            },
            limited: function (point) {
                var map = this.map();
                if (!map) {
                    return [0, 0];
                }
                return [
                    Math.max(0, Math.min(map[0].length - 1, point[0])),
                    Math.max(0, Math.min(map.length - 1, point[1]))
                ];
            }
        },
        statics: {
            compareColor: function (color1, color2) {
                var diff = 10;
                if (Math.abs(color1.A - color2.A) < diff) {
                    if (Math.abs(color1.R - color2.R) < diff) {
                        if (Math.abs(color1.G - color2.G) < diff) {
                            if (Math.abs(color1.B - color2.B) < diff) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            }
        }
    });
})(nx);
