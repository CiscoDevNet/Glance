(function (nx) {
    var sqrt = Math.sqrt;
    var square = nx.math.square;
    var abs = Math.abs;
    /**
     * @class Line
     * @namespace nx.geometry
     */
    var EXPORT = nx.define("nx.geometry.Line", {
        statics: {
            getDistance: function (x1, y1, x2, y2) {
                return sqrt(square(x2 - x1) + square(y2 - y1));
            },
            getPointToSegment: function (x0, y0, x1, y1, x2, y2) {
                var A, B, C, D, u, ud, ud1, ud2;
                var xpedal, ypedal, dpedal;
                var xclosest, yclosest, dclosest;
                // check if it is a segment
                if (x1 == x2 && y1 == y2) {
                    // not a real segment
                    return;
                }
                // line: Ax+By+C=0
                A = y1 - y2, B = x2 - x1, C = x1 * y2 - x2 * y1;
                // 2D: unit=root(AA+BB)
                u = sqrt(A * A + B * B);
                // perpendicular: Bx-Ay+D=0
                D = A * y0 - B * x0;
                // united-distances from p1&p2 to perpendicular
                ud = A * x0 + B * y0 + C;
                ud1 = B * x1 - A * y1 + D;
                ud2 = B * x2 - A * y2 + D;
                // get pedal and its distance
                dpedal = abs(ud) / u;
                xpedal = -(C * A + B * D) / (A * A + B * B);
                ypedal = -(C * B - A * D) / (A * A + B * B);
                // check if pedal on the segment
                if (ud1 * ud2 > 0) {
                    // out of segment
                    if (abs(ud1) < abs(ud2)) {
                        xclosest = x1, yclosest = y1;
                        dclosest = sqrt(ud * ud + ud1 * ud1) / u;
                    } else {
                        xclosest = x2, yclosest = y2;
                        dclosest = sqrt(ud * ud + ud2 * ud2) / u;
                    }
                } else {
                    xclosest = xpedal, yclosest = ypedal, dclosest = dpedal;
                }
                return {
                    pedal: {
                        x: xpedal,
                        y: ypedal,
                        distance: dpedal
                    },
                    closest: {
                        x: xclosest,
                        y: yclosest,
                        distance: dclosest
                    }
                };
            },
            getPointParameters: function (point) {
                return {
                    x: point.length ? point[0] : point.x,
                    y: point.length ? point[1] : point.y
                };
            },
            getLineParameters: function (line) {
                if (!line.length) {
                    return line;
                }
                var p0 = line[0];
                var p1 = line[1];
                var x0 = p0.length ? p0[0] : p0.x;
                var x1 = p1.length ? p1[0] : p1.x;
                var y0 = p0.length ? p0[1] : p0.y;
                var y1 = p1.length ? p1[1] : p1.y;
                var A = y1 - y0;
                var B = x1 - x0;
                var C = x0 * y1 - x1 * y0;
                return {
                    A: A,
                    B: B,
                    C: C
                };
            },
            getDistanceFromPointToSegment: function (point, line) {
                var point = EXPORT.getPointParameters(point);
                var line = EXPORT.getLineParameters(line);
                return (line.A * point.x + line.B * point.y + line.C) / Math.sqrt(line.A * line.A + line.B * line.B);
            },
            getPointProjectionOnLine: function (point, line) {
                var point = EXPORT.getPointParameters(point);
                var line = EXPORT.getLineParameters(line);
                var P = line.A * point.y - line.B * point.x;
                var R = line.A * line.A + line.B * line.B;
                return {
                    x: -(line.A * line.C + line.B * P) / R,
                    y: -(line.B * line.C - line.A * P) / R
                };
            }
        }
    });
})(nx);
