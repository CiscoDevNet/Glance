(function (nx) {
    var GeoMath = nx.geometry.Math;
    var Vector = nx.geometry.Vector;
    /**
     * @class BezierCurve
     * @namespace nx.geometry
     */
    var EXPORT = nx.define("nx.geometry.BezierCurve", {
        statics: (function () {
            var pascal = (function () {
                var triangle = [
                    [],
                    [1],
                    [1, 1]
                ];
                return function (n) {
                    if (triangle[n]) {
                        return triangle[n];
                    }
                    var i, last = pascal(n - 1);
                    var row = [];
                    for (i = 0; i < last.length - 1; i++) {
                        row[i] = last[i] + last[i + 1];
                    }
                    row.push(1);
                    row.unshift(1);
                    triangle[n] = row;
                    return row;
                };
            })();

            function transformBezierToPolyline(bezier) {
                var i, polyline = [];
                for (i = 0; i < bezier.length - 1; i++) {
                    polyline.push([bezier[i], bezier[i + 1]]);
                }
                return polyline;
            }

            function transformPolylineToBezier(polyline) {
                var i, bezier = [polyline[0][0]];
                for (i = 0; i < polyline.length; i++) {
                    bezier.push(polyline[i][1]);
                }
                return bezier;
            }

            function transformRecursiveSeparatePoints(rates) {
                var i = 0,
                    last = 0,
                    result = [];
                for (i = 0; i < rates.length; i++) {
                    if (i === rates.length - 1 && rates[i] === 1) {
                        break;
                    }
                    if (typeof rates[i] !== "number" || rates[i] <= last || rates[i] >= 1) {
                        throw "Invalid bread point list: " + rates.join(",");
                    }
                    result.push((rates[i] - last) / (1 - last));
                    last = rates[i];
                }
                return result;
            }
            return {
                slice: function (bezier, from, to) {
                    if (from === 0) {
                        if (to === 0) {
                            return null;
                        }
                        return EXPORT.breakdown(bezier, to).beziers[0];
                    } else if (!to) {
                        return EXPORT.breakdown(bezier, from).beziers[1];
                    } else {
                        return EXPORT.breakdown(bezier, from, to).beziers[1];
                    }
                },
                breakdown: function (bezier) {
                    // get the rest arguments
                    var rates = Array.prototype.slice.call(arguments, 1);
                    if (!rates.length) {
                        throw "Invalid argument length: " + arguments.length;
                    }
                    rates = transformRecursiveSeparatePoints(rates);
                    var rate, polyline, sep, points = [bezier[0]],
                        beziers = [];
                    // transform bezier points into lines
                    polyline = transformBezierToPolyline(bezier);
                    // iterate all rates
                    while (rates.length) {
                        // get the separate ratio
                        rate = rates.shift();
                        // separate the rest bezier
                        sep = EXPORT.separate(polyline, rate);
                        // mark the points and beziers
                        points.push(sep.point);
                        beziers.push(transformPolylineToBezier(sep.left));
                        // get the rest
                        polyline = sep.right;
                    }
                    // append the rest bezier
                    points.push(bezier[bezier.length - 1]);
                    beziers.push(transformPolylineToBezier(polyline));
                    return {
                        points: points,
                        beziers: beziers
                    };
                },
                /**
                 * @method separate
                 * @param polyline List of intervals (interval=[point-from, point-to], point=[x, y]).
                 * @param rate The rate to separate.
                 * @return {point:[x, y], left: leftPolyline, right: rightPolyline}
                 */
                separate: function separate(polyline, rate) {
                    var rest = 1 - rate;
                    var intervalSeparatePoint = function (interval) {
                        return [interval[0][0] * rest + interval[1][0] * rate, interval[0][1] * rest + interval[1][1] * rate];
                    };
                    var intervalInter = function (i1, i2) {
                        return [intervalSeparatePoint([i1[0], i2[0]]), intervalSeparatePoint([i1[1], i2[1]])];
                    };
                    var polylineLower = function (polyline) {
                        var i, rslt = [];
                        for (i = 0; i < polyline.length - 1; i++) {
                            rslt.push(intervalInter(polyline[i], polyline[i + 1]));
                        }
                        return rslt;
                    };
                    // start iterate
                    var point, left = [],
                        right = [];
                    var intervals = polyline,
                        interval;
                    while (intervals.length) {
                        interval = intervals[0];
                        left.push([interval[0], intervalSeparatePoint(interval)]);
                        interval = intervals[intervals.length - 1];
                        right.unshift([intervalSeparatePoint(interval), interval[1]]);
                        if (intervals.length == 1) {
                            point = intervalSeparatePoint(intervals[0]);
                        }
                        intervals = polylineLower(intervals);
                    }
                    return {
                        point: point,
                        left: left,
                        right: right
                    }
                },
                through: function (points, grade) {
                    // get default grade
                    if (grade === undefined) {
                        grade = points.length - 1;
                    }
                    // check if grade is too low
                    if (grade < 2) {
                        return null;
                    }
                    // TODO generalized algorithm for all grade
                    var anchors = [];
                    if (grade === 2) {
                        var A = points[0];
                        var B = points[2];
                        var X = points[1];
                        var O = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
                        var XX = [X[0] * 2 - O[0], X[1] * 2 - O[1]];
                        anchors.push(A, XX, B);
                    }
                    return anchors;
                },
                byLength: function (bezier, precision) {
                    precision = precision || 1;
                    var internal = {
                        length: 0,
                        map: [],
                        accumulate: function () {
                            var segment, segments = internal.separate(transformBezierToPolyline(bezier), 1);
                            var map = internal.map;
                            var length, rate, idx;
                            idx = length = rate = 0;
                            do {
                                // mark on map
                                idx = Math.round(length / precision);
                                map[idx] || (map[idx] = rate);
                                // accumulate length
                                segment = segments.shift();
                                if (!segment) {
				    // the last rate must be one
                                    map[idx] = 1;
                                    break;
                                }
                                length += segment.length;
                                rate += segment.rate;
                            } while (true);
                            internal.length = length;
                        },
                        separate: function (polyline, rate) {
                            var sep;
                            var pa = polyline[0][0];
                            var pb = polyline[polyline.length - 1][1];
                            var distance = internal.distance(pa, pb);
                            if (internal.approximate(polyline)) {
                                return [{
                                    length: distance,
                                    rate: rate
                                }];
                            } else {
                                sep = EXPORT.separate(polyline, 0.5);
                                pa = internal.separate(sep.left, rate / 2);
                                pb = internal.separate(sep.right, rate / 2);
                                return pa.concat(pb);
                            }
                        },
                        approximate: function (polyline) {
                            var i, pb, pa = polyline[0][0];
                            for (i = 0; i < polyline.length; i++) {
                                pb = polyline[i][1];
                                if (Math.abs(pb[1] - pa[1]) + Math.abs(pb[0] - pa[0]) > precision) {
                                    return false;
                                }
                            }
                            return true;
                        },
                        distance: function (p1, p2) {
                            var dx = p2[0] - p1[0];
                            var dy = p2[1] - p1[0];
                            return Math.sqrt(dx * dx + dy * dy);
                        }
                    };
                    internal.accumulate();
                    var result = {
                        length: internal.length,
                        mapped: function (percentage) {
                            return internal.map[Math.round(internal.length * percentage / precision)];
                        },
                        slice: function (from, to) {
                            return EXPORT.slice(bezier, result.mapped(from), result.mapped(to));
                        },
                        breakdown: function () {
                            var args = Array.prototype.slice.call(arguments).map(result.mapped);
                            args.unshift(bezier);
                            return EXPORT.breakdown.apply(this, args);
                        }
                    };
                    return result;
                }
            };
        })()
    });
})(nx);
