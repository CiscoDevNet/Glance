(function (nx) {
    var EXPORT = nx.define("glance.common.map.PathFinderProvider", {
        properties: {
            maskUrl: {},
            maskPixelProcessor: {},
            image: {
                dependencies: "maskPixelProcessor",
                async: true,
                value: function (property, maskPixelProcessor) {
                    var image = property.get();
                    if (!image) {
                        image = new Image();
                        image.onerror = function () {
                            // TODO
                        };
                        property.set(image);
                    }
                    var self = this;
                    image.onload = function () {
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
                            pixel = [data[i], data[i + 1], data[i + 2], data[i + 3]];
                            row[p] = maskPixelProcessor ? maskPixelProcessor(pixel) : pixel;
                        }
                        // create a finder
                        self.finder(new glance.common.map.PathFinder({
                            map: map
                        }));
                    }
                }
            },
            finder: {
                dependencies: "maskUrl",
                async: true,
                value: function (property, maskUrl, maskPixelProcessor) {
                    if (maskUrl) {
                        this.image().src = maskUrl + "?x=" + nx.uuid();
                    }
                }
            }
        },
        methods: {
            init: function (options) {
                this.inherited();
                nx.sets(this, options);
            }
        }
    });
})(nx);
