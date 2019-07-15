(function(nx) {
    var sqrt = Math.sqrt;
    var EXPORT = nx.define("glance.perspective.Heatmap", {
        statics: {
            getHeatmapTexture: (function() {
                var PRECISION = 16;
                var AREA = 10;
                var ZOOM = 16;
                var TOP = 3;
                var COLORS = (function() {
                    var NCOLOR = 80;
                    var STOPS = [
                        [255, 176, 84, 0],
                        [255, 0, 0, 1]
                    ];

                    var AMIN, AMAX;
                    AMIN = 0.0, AMAX = 0.6;
                    var color, colors = [];
                    var i, rate, r, g, b, a;
                    var s, stop0, stop1, rate0, rate1;
                    for (i = 0, s = 0; i < NCOLOR; i++) {
                        // get the rate
                        rate = i / NCOLOR;
                        // get stops
                        stop0 = STOPS[s];
                        stop1 = STOPS[s + 1];
                        rate0 = (stop1[3] - rate) / (stop1[3] - stop0[3]);
                        rate1 = (rate - stop0[3]) / (stop1[3] - stop0[3]);
                        // get rgba
                        r = Math.floor(stop0[0] * rate0 + stop1[0] * rate1);
                        g = Math.floor(stop0[1] * rate0 + stop1[1] * rate1);
                        b = Math.floor(stop0[2] * rate0 + stop1[2] * rate1);
                        a = rate * AMAX + (1 - rate) * AMIN;
                        // get color
                        colors.push("rgba(" + [r, g, b, a].join(",") + ")");
                        // check gradient
                        if (rate > stop1[3]) {
                            s++;
                        }
                    }
                     // console.log(colors);
                    return colors;
                })();
                var Canvas = nx.define(nx.ui.tag.Canvas, {
                    properties: {
                        zoom: 10,
                        showDots: false,
                        showRules: false
                    },
                    methods: {
                        redraw: function(total, areas) {
                            var canvas = this.dom();
                            var context = this._context = this._context || canvas.getContext("2d");
                            // reset canvas size
                            var size = PRECISION * ZOOM;
                            canvas.width = size;
                            canvas.height = size;
                            context.fillStyle = "transparent";
                            context.clearRect(0, 0, size, size);
                            // draw the heat map
                            var radius = ZOOM * 2.5;
                            var r, c, x, y, area, count, heat, color, gradient;
                            for (r = 0; r < PRECISION; r++) {
                                y = (r + 0.5) * ZOOM;
                                area = areas[r];
                                for (c = 0; c < PRECISION; c++) {
                                    x = (c + 0.5) * ZOOM;
                                    // get the weight of this area
                                    count = area[c];
                                    // paint on the stage
                                    if (count) {
                                        heat = Math.min(1, count * areas.length * area.length / total / 4);
                                        color = COLORS[Math.ceil(heat * (COLORS.length - 1))];
                                        gradient = context.createRadialGradient(x, y, 1, x, y, radius);
                                        gradient.addColorStop(0, color);
                                        gradient.addColorStop(1, "transparent");
                                        context.beginPath();
                                        context.fillStyle = gradient;
                                        context.fillRect(0, 0, size, size);
                                        context.fill();
                                        context.closePath();
                                    }
                                }
                            }
                        }
                    }
                });
                var increase = function(areas, x, y, weight) {
                    var r, c, area, dx, dy, rate;
                    for (r = 0; r < PRECISION; r++) {
                        area = areas[r];
                        dy = r - y;
                        for (c = 0; c < PRECISION; c++) {
                            dx = c - x;
                            rate = 1 - sqrt(dx * dx + dy * dy) * AREA / PRECISION;
                            if (rate > 0) {
                                rate = Math.pow(rate, 3);
                                area[c] += weight * rate;
                            }
                        }
                    }
                };
                return function(width, height, positions, callback) {
                    var resources = new nx.Object();
                    // dirty mark
                    var dirty = false;
                    // get the row/column count
                    var size = Math.max(width, height);
                    var cell = size / PRECISION;
                    // initialize areas
                    var r, c, area, areas = [];
                    for (r = 0; r < PRECISION; r++) {
                        area = areas[r] = [];
                        for (c = 0; c < PRECISION; c++) {
                            area[c] = 0;
                        }
                    }
                    resources.retain(positions.monitorContaining(function(position) {
                        if (!position) {
                            return;
                        }
                        var r, c;
                        r = Math.min(PRECISION - 1, Math.floor(position[1] / cell));
                        c = Math.min(PRECISION - 1, Math.floor(position[0] / cell));
                        g(areas, c, r, 1);
                        dirty = true;
                        return function() {
                            increase(areas, c, r, -1);
                            dirty = true;
                        };
                    }));
                    // drawing
                    var texture, canvas = new Canvas();
                    resources.retain(nx.timer(100, function(again) {
                        if (dirty) {
                            canvas.redraw(Math.max(100, positions.length()), areas);
                            if (texture) {
                                texture.dispose();
                            }
                            texture = new THREE.Texture(canvas.dom());
                            texture.wrapS = THREE.RepeatWrapping;
                            texture.wrapT = THREE.RepeatWrapping;
                            texture.repeat.set(1 / size, -1 / size);
                            texture.needsUpdate = true;
                            callback(texture);
                            dirty = false;
                        }
                        again(1000 );
                    }));
                    resources.retain({
                        release: function() {
                            texture && texture.dispose();
                        }
                    });
                    resources.retain(canvas);
                    return resources;
                };
            })()
        }
    });
})(nx);
