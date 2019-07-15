/**
 * Created by Jay on 2016/12/8.
 */
var wave = {
    deepCopy: function deepCopy(o) {
        if (o instanceof Array) {
            var n = [];
            for (var i = 0; i < o.length; i++) {
                n[i] = deepCopy(o[i]);
            }
            return n;
        } else if (o instanceof Object) {
            var n = {}
            for (var i in o) {
                n[i] = deepCopy(o[i]);
            }
            return n;
        } else {
            return o;
        }
    },
    rgbToHsl: function(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        return [h, s, l];
    },
    getZ: function(vertice, density, r) {
        var x = vertice.x;
        var y = vertice.y;
        var z = 0;
        for (var i = 0; i < density.length; i++) {
            if (!(density[i].position[0] < x - r || density[i].position[0] > x + r || density[i].position[1] < y - r || density[i].position[1] > y + r)) {
                var deltaX = x - density[i].position[0];
                var deltaY = y - density[i].position[1];
                var length = Math.pow(deltaX * deltaX + deltaY * deltaY, 0.5);
                if (length <= r) {
                    z += density[i].count * Math.pow(Math.sin(Math.PI / 2 * (1 - length / r)), 4);
                }
            }
        }
        return z;
    },
    color: function(num1, num2) {
        var NCOLOR = 100;
        var STOPS = [
            [255, 0, 0],
            [255, 255, 0],
            [255, 255, 255],
            [100, 100, 255]
        ];
        var colors = [];
        var i, rate, r, g, b;
        var s, stop0, stop1;
        for (i = 0, s = 2; i < NCOLOR / 5; i++) {
            // get the rate
            rate = i * 5 / NCOLOR;
            // get stops
            stop0 = STOPS[s];
            stop1 = STOPS[s + 1];
            // get rgb

            r = Math.floor(stop0[0] * rate + stop1[0] * (1 - rate));

            // get color
            colors.push([r, r, 255]);
        }
        for (i = 0, s = 1; i < NCOLOR * 3 / 10; i++) {
            // get the rate
            rate = i * 10 / (3 * NCOLOR);
            // get stops
            stop0 = STOPS[s];
            stop1 = STOPS[s + 1];
            // get rgb

            b = Math.floor(stop0[2] * rate + stop1[2] * (1 - rate));

            // get color
            colors.push([255, 255, b]);
        }
        for (i = 0, s = 0; i <= NCOLOR / 2; i++) {
            // get the rate
            rate = i * 2 / NCOLOR;
            // get stops
            stop0 = STOPS[s];
            stop1 = STOPS[s + 1];
            // get rgb

            g = Math.floor(stop0[1] * rate + stop1[1] * (1 - rate));

            // get color
            colors.push([255, g, 0]);
        }
        return colors[num1][num2];
    },
    handle: function(vertices, density, depth, height) {
        var zMax = 0;
        for (var i = 0; i < vertices.length; i++) {
            vertices[i].z = wave.getZ(vertices[i], density, depth / 4);
            vertices[i] = {
                x: vertices[i].x,
                y: vertices[i].y,
                z: vertices[i].z
            };
            if (vertices[i].z > zMax) {
                zMax = vertices[i].z;
            }
        }
        for (var i = 0; i < vertices.length; i++) {
            var z = (zMax ? vertices[i].z / zMax : 0);
            Z = 10 + height * z;
            num = Math.round(z * 100);
            hslColor = wave.rgbToHsl(wave.color(num, 0), wave.color(num, 1), wave.color(num, 2));
            vertices[i].hslColor = hslColor;
            vertices[i].z = Z;
        }
        return vertices;
    },
    //message to main thread
    onmessage: function(message) {
        var result = wave.handle(message.vertices, message.density, message.depth, message.height);
        postMessage({
            id: message.id,
            vertices: result
        })
    }
};
//get message from main thread，run wave.onmessage()
onmessage = function(evt) {
    wave.onmessage(evt.data);
};
