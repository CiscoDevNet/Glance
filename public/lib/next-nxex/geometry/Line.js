(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class Line
     * @namespace nxex.geometry
     */
    var EXPORT = nx.define("nxex.geometry.Line", nx.Observable, {
        statics: {
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
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
