(function(nx) {
    var rPath = /(?:\s*,\s*)?(?:([ZzMmLlHhVvCcSsQqTtAa])((?:(?:\s*,\s*)?[+-]?(?:\d*\.)?\d+(?:[eE][+-]?(?:\d*\.)?\d+)?)*))/g;
    var rDigits = /[+-]?(?:\d*\.)?\d+(?:[eE][+-]?(?:\d*\.)?\d+)?/g;
    var TAU = Math.PI * 2;

    var EXPORT = nx.define("glance.model.map.MapLoader", {
        statics: {
            loadAndInit: function(buildingId, floorId, urlMask, urlMap, callback) {
                var resources = new nx.Object();
                resources.retain(EXPORT.load(urlMap, function(map) {
                    nx.each([map.entrances(), map.terrains()], function(clients) {
                        nx.each(clients, function(client) {
                            nx.path(client, "group", buildingId + ":" + nx.path(client, "id"));
                            nx.path(client, "buildingId", buildingId);
                            nx.path(client, "floorId", floorId);
                        });
                    });
                    if (urlMask) {
                        resources.retain("loadMask", nx.ui.tag.Image.load(urlMask, function(result) {
                            if (result.success) {
                                map.mask(result.image);
                            }
                        }));
                    }
                    callback(map);
                }));
                return resources;
            },
            load: function(urlMap, callback) {
                var resources = new nx.Object();
                var map = new glance.model.map.MapModel();
                resources.retain(nx.util.ajax({
                    url: urlMap,
                    success: function(resources, svg) {
                        // svg
                        svg = glance.common.Util.getRealSvg(svg);
                        map.svg(svg);
                        // set size to square
                        var size = nx.lib.svg.Svg.getSvgSize(svg);
                        var s = EXPORT.setSquareForTexture(svg, size);
                        map.width(size.width);
                        map.height(size.height);
                        // get terrain
                        var areas = EXPORT.getAnalysisAreas(svg);
                        nx.each(areas, function(info) {
                            var model, special = false;
                            if (info.category === "boundary") {
                                map.shape(info.shape);
                                special = true;
                            } else {
                                nx.each(["elevator", "stair", "lift", "escalator"], function(prefix) {
                                    if (info.category === prefix) {
                                        model = new glance.model.ClientModel({
                                            online: true,
                                            category: prefix,
                                            id: nfo.id,
                                            name: info.id,
                                            shape: info.shape,
                                            position: info.position,
                                            color: info.color
                                        });
                                        map.entrances().push(model);
                                        special = true;
                                    }
                                });
                            }
                            if (!special) {
                                model = new glance.model.ClientModel({
                                    online: true,
                                    category: info.category,
                                    id: info.id,
                                    name: info.id,
                                    shape: info.shape,
                                    position: info.position,
                                    color: info.color
                                });
                                map.terrains().push(model);
                            }
                        });
                        // add default boundary
                        if (!map.shape()) {
                            map.shape(EXPORT.getShapeByBound(0, 0, size.width, size.height));
                        }
                        callback(map);
                    },
                    error: function() {
                        // TODO
                    }
                }));
                return resources;
            },
            setSquareForTexture: function(svg, size) {
                var s = glance.common.Util.getTextureSize(size.width, size.height, true).size;
                if (s !== size.width || s !== size.height) {
                    svg.setAttribute("width", s + "px");
                    svg.setAttribute("height", s + "px");
                    svg.setAttribute("viewBox", [0, 0, s, s].join(" "));
                }
                return s;
            },
            getShapeByBound: function(x, y, width, height) {
                var shape = new THREE.Shape();
                shape.moveTo(x, y);
                shape.lineTo(x + width, y);
                shape.lineTo(x + width, y + height);
                shape.lineTo(x, y + height);
                shape.lineTo(x, y);
                return shape;
            },
            getShapeInfoByRect: function(rect) {
                var x, y, w, h;
                var transform, matrix, vector, shape;
                x = rect.getAttribute("x") * 1;
                y = rect.getAttribute("y") * 1;
                w = rect.getAttribute("width") * 1;
                h = rect.getAttribute("height") * 1;
                transform = rect.getAttribute("transform");
                if (!transform) {
                    shape = EXPORT.getShapeByBound(x, y, w, h);
                } else {
                    matrix = nx.util.cssstyle.toMatrixByTransform(transform);
                    vector = [
                        nx.geometry.Vector.transform([x, y], matrix),
                        nx.geometry.Vector.transform([x + w, y], matrix),
                        nx.geometry.Vector.transform([x + w, y + h], matrix),
                        nx.geometry.Vector.transform([x, y + h], matrix)
                    ];
                    shape = new THREE.Shape();
                    shape.moveTo(vector[0][0], vector[0][1]);
                    shape.lineTo(vector[1][0], vector[1][1]);
                    shape.lineTo(vector[2][0], vector[2][1]);
                    shape.lineTo(vector[3][0], vector[3][1]);
                }
                return {
                    position: [x + w / 2, y + h / 2],
                    shape: shape
                };
            },
            getShapeInfoByPolygon: function(polygon) {
                var points, digits;
                points = polygon.getAttribute("points");
                if (points) {
                    digits = (points.match(rDigits) || []).map(function(digit) {
                        return digit * 1;
                    });
                    points = [];
                    while (digits.length) {
                        points.push([1 * digits.shift(), 1 * digits.shift()]);
                    }
                    if (points.length) {
                        return EXPORT.getShapeInfoByPolygonPoints(points);
                    }
                }
            },
            getShapeInfoByPolygonPoints: function(points) {
                var point, x, y, x1, x2, y1, y2;
                var shape = new THREE.Shape();
                if (points[points.length - 1][0] !== points[0][0] || points[points.length - 1][1] !== points[0][1]) {
                    points.push(points[0]);
                }
                point = points.shift();
                shape.moveTo(point[0], point[1]);
                while (points.length) {
                    point = points.shift();
                    x = point[0];
                    y = point[1];
                    x1 = x > x1 ? x1 : x;
                    x2 = x < x2 ? x2 : x;
                    y1 = y > y1 ? y1 : y;
                    y2 = y < y2 ? y2 : y;
                    shape.lineTo(x, y);
                }
                return {
                    position: [x1 / 2 + x2 / 2, y1 / 2 + y2 / 2],
                    shape: shape
                };

            },
            getShapeInfoByPathD: function(d) {
                var x1, x2, y1, y2;
                var shape, stop, stops = [];
                if (d) {
                    d.replace(rPath, function(matched, g1, g2, idx) {
                        stops.push([g1, (g2.match(rDigits) || []).map(function(v) {
                            return v * 1;
                        })]);
                    });
                    var i, p0, p, pp, pc, args, m, path;
                    // comment: pp for previous point
                    // comment: pc for path-Cc
                    // comment: pq for path-Qq
                    p0 = pp = [0, 0];
                    if (stops[0][0] !== "m" && stops[0][0] !== "M") {
                        stops.unshift(["M", [0, 0]]);
                    }
                    path = shape = new THREE.Shape();
                    for (i = 0; i < stops.length; i++) {
                        stop = stops[i];
                        // draw path
                        p = stop[1] && stop[1].slice();
                        switch (stop[0]) {
                            case "m":
                                p[0] += pp[0];
                                p[1] += pp[1];
                            case "M":
                                // draw
                                path.moveTo.apply(path, p);
                                // update
                                p0 = p;
                                pp = p;
                                pc = null;
                                pq = null;
                                break;
                            case "l":
                                p[0] += pp[0];
                                p[1] += pp[1];
                            case "L":
                                // draw
                                path.lineTo.apply(path, p);
                                // update
                                pp = p;
                                pc = null;
                                pq = null;
                                break;
                            case "h":
                                p[0] += pp[0];
                            case "H":
                                p[1] = pp[1];
                                // draw
                                path.lineTo.apply(path, p);
                                // update
                                pp = p;
                                pc = null;
                                pq = null;
                                break;
                            case "v":
                                p[1] = p[0] + pp[1];
                                p[0] = pp[0];
                                // draw
                                path.lineTo.apply(path, p);
                                // update
                                pp = p;
                                pc = null;
                                pq = null;
                                break;
                            case "V":
                                p[1] = p[0];
                                p[0] = pp[0];
                                // draw
                                path.lineTo.apply(path, p);
                                // update
                                pp = p;
                                pc = null;
                                pq = null;
                                break;
                            case "a":
                                p[5] += pp[0];
                                p[6] += pp[1];
                            case "A":
                                p = EXPORT.arcToBezier(pp.concat(p));
                                stops.splice.apply(stops, [i, 1].concat(p.map(function(curve) {
                                    return ["C", curve];
                                })));
                                i--;
                                continue;
                            case "c":
                                p[0] += pp[0];
                                p[1] += pp[1];
                                p[2] += pp[0];
                                p[3] += pp[1];
                                p[4] += pp[0];
                                p[5] += pp[1];
                            case "C":
                                // draw
                                path.bezierCurveTo.apply(path, p);
                                // update
                                pp = [p[4], p[5]];
                                pc = [p[4] * 2 - p[2], p[5] * 2 - p[3]];
                                pq = null;
                                break;
                            case "s":
                                p[0] += pp[0];
                                p[1] += pp[1];
                                p[2] += pp[0];
                                p[3] += pp[1];
                            case "S":
                                if (!pc) {
                                    pc = [p[0], p[1]];
                                }
                                // draw
                                path.bezierCurveTo.apply(path, pc.concat(p));
                                // update
                                pp = [p[2], p[3]];
                                pc = [p[2] * 2 - p[0], p[3] * 2 - p[1]];
                                pq = null;
                                break;
                            case "q":
                                p[0] += pp[0];
                                p[1] += pp[1];
                                p[2] += pp[0];
                                p[3] += pp[1];
                            case "Q":
                                // draw
                                path.bezierCurveTo.apply(path, [p[0], p[1], p[0], p[1], p[2], p[3]]);
                                // update
                                pp = [p[2], p[3]];
                                pc = null;
                                pq = [p[2] * 2 - p[0], p[3] * 2 - p[1]];
                                break;
                            case "t":
                                p[0] += pp[0];
                                p[1] += pp[1];
                            case "T":
                                if (!pq) {
                                    // draw
                                    path.lineTo.apply(path, p);
                                    // update
                                    pp = p;
                                    pc = null;
                                    pq = null;
                                } else {
                                    // draw
                                    path.bezierCurveTo.apply(path, [pq[0], pq[1], pq[0], pq[1], p[0], p[1]]);
                                    // update
                                    pp = p;
                                    pc = null;
                                    pq = [p[0] * 2 - pq[0], p[1] * 2 - pq[1]];
                                }
                                break;
                            case "z":
                            case "Z":
                                if (!nx.math.approximate(p0[0], pp[0]) || !nx.math.approximate(p0[1], pp[1])) {
                                    // draw
                                    path.lineTo.apply(path, p0);
                                }
                                // clear current path
                                path.lineTo.apply(path, p0);
                                // update
                                pp = p0;
                                pc = null;
                                pq = null;
                                break;
                        }
                        x1 = pp[0] > x1 ? x1 : pp[0];
                        x2 = pp[0] < x2 ? x2 : pp[0];
                        y1 = pp[1] > y1 ? y1 : pp[1];
                        y2 = pp[1] < y2 ? y2 : pp[1];
                    }
                    return {
                        position: [x1 / 2 + x2 / 2, y1 / 2 + y2 / 2],
                        shape: shape
                    };
                }
            },
            getShapeInfoByPath: function(svgpath) {
                var d = svgpath.getAttribute("d");
                return EXPORT.getShapeInfoByPathD(d);
            },
            getAnalysisAreas: function(svg) {
                var size = nx.lib.svg.Svg.getSvgSize(svg);
                return EXPORT.withSvgAttaching(size, svg, function() {
                    var areas = [];
                    // TODO circle, line and polyline
                    // TODO stroke handle
                    var elements = svg.querySelectorAll("rect, polygon, path");
                    nx.each(elements, function(element, idx) {
                        var info = EXPORT.getInfoByAnalysisElement(element);
                        if (info && info.shape.curves.length > 0) {
                            areas.push(info);
                        }
                    });
                    return areas;
                });
            },
            getInfoCategoryByElement: function(element) {
                var selected;
                if (element.getAttribute("id") === "boundary") {
                    selected = "boundary";
                } else {
                    nx.each(["boundary", "wall", "barrier", "region", "mark"], function(cssclassname) {
                        if (nx.util.cssclass.has(element, cssclassname) || nx.util.cssclass.has(element.parentNode, cssclassname)) {
                            selected = cssclassname;
                            return false;
                        }
                    });
                }
                return selected;
            },
            getElementFillActually: function(element) {
                // get category
                var opacity = window.getComputedStyle(element).opacity * 1;
                var fill = window.getComputedStyle(element).fill;
                fill = nx.util.cssstyle.toRgbaArray(fill, opacity);
                return fill;
            },
            getInfoByAnalysisElement: function(element) {
                var id, node, info, infor, fill, category;
                infor = EXPORT["getShapeInfoBy" + element.tagName.charAt(0).toUpperCase() + element.tagName.substring(1).toLowerCase()];
                info = infor && infor(element);
                if (info) {
                    fill = EXPORT.getElementFillActually(element);
                    category = EXPORT.getInfoCategoryByElement(element);
                    // setup info
                    info.id = element.getAttribute("id");
                    info.color = fill;
                    if (category) {
                        info.category = category;
                    } else if (fill[3] == 1 && ((fill[0] | fill[1] | fill[2]) === 0)) {
                        info.category = "block";
                    } else if (fill[3] == 0 && ((fill[0] | fill[1] | fill[2]) === 0)) {
                        info.category = "zone";
                    } else if (fill[3] == 1 && ((fill[0] === 255 && fill[1] === 255 && fill[2] === 255))) {
                        info.category = "boundary";
                    } else {
                        info.category = "furnish";
                    }
                    return info;
                }
            },
            getAreas: function(svg) {
                var areas = {};
                var rects = svg.querySelectorAll("rect[id]");
                var polygons = svg.querySelectorAll("polygon[id]");
                var paths = svg.querySelectorAll("path[id]");
                nx.each(rects, function(rect) {
                    var id = rect.getAttribute("id");
                    id = id.replace(/_/g, " ");
                    var info = EXPORT.getShapeInfoByRect(rect);
                    if (info) {
                        areas[id] = info;
                    }
                });
                nx.each(polygons, function(polygon) {
                    var id = polygon.getAttribute("id");
                    id = id.replace(/_/g, " ");
                    var info = EXPORT.getShapeInfoByPolygon(polygon);
                    if (info) {
                        areas[id] = info;
                    }
                });
                nx.each(paths, function(path) {
                    var id = path.getAttribute("id");
                    id = id.replace(/_/g, " ");
                    var info = EXPORT.getShapeInfoByPath(path);
                    if (info) {
                        areas[id] = info;
                    }
                });
                return areas;
            },
            withSvgAttaching: function(size, svg, callback) {
                var resources = new nx.Object();
                var container = new nx.ui.Element();
                container.setStyle({
                    "position": "absolute",
                    "left": -size.width,
                    "top": -size.height,
                    "width": size.width,
                    "height": size.height
                });
                container.append(svg);
                resources.retain(container.appendTo());
                var result = callback(svg);
                resources.release();
                return result;
            },
            mapToEllipse: (x, y, rx, ry, cosphi, sinphi, centerx, centery) => {
                x *= rx, y *= ry;
                const xp = cosphi * x - sinphi * y;
                const yp = sinphi * x + cosphi * y;
                return [xp + centerx, yp + centery];
            },
            approxUnitArc: (ang1, ang2) => {
                const a = 4 / 3 * Math.tan(ang2 / 4);

                const x1 = Math.cos(ang1);
                const y1 = Math.sin(ang1);
                const x2 = Math.cos(ang1 + ang2);
                const y2 = Math.sin(ang1 + ang2);

                return [{
                    x: x1 - y1 * a,
                    y: y1 + x1 * a,
                }, {
                    x: x2 + y2 * a,
                    y: y2 - x2 * a,
                }, {
                    x: x2,
                    y: y2,
                }, ];
            },
            vectorAngle: (ux, uy, vx, vy) => {
                const sign = (ux * vy - uy * vx < 0) ? -1 : 1;
                const umag = Math.sqrt(ux * ux + uy * uy);
                const vmag = Math.sqrt(ux * ux + uy * uy);
                const dot = ux * vx + uy * vy;

                let div = dot / (umag * vmag);

                if (div > 1) {
                    div = 1
                }

                if (div < -1) {
                    div = -1;
                }

                return sign * Math.acos(div);
            },
            getArcCenter: (px, py, cx, cy, rx, ry, largeArcFlag, sweepFlag, sinphi, cosphi, pxp, pyp) => {
                const rxsq = Math.pow(rx, 2);
                const rysq = Math.pow(ry, 2);
                const pxpsq = Math.pow(pxp, 2);
                const pypsq = Math.pow(pyp, 2);
                let radicant = (rxsq * rysq) - (rxsq * pypsq) - (rysq * pxpsq);
                if (radicant < 0) {
                    radicant = 0;
                }
                radicant /= (rxsq * pypsq) + (rysq * pxpsq);
                radicant = Math.sqrt(radicant) * (largeArcFlag === sweepFlag ? -1 : 1);
                const centerxp = radicant * rx / ry * pyp;
                const centeryp = radicant * -ry / rx * pxp;
                const centerx = cosphi * centerxp - sinphi * centeryp + (px + cx) / 2;
                const centery = sinphi * centerxp + cosphi * centeryp + (py + cy) / 2;
                const vx1 = (pxp - centerxp) / rx;
                const vy1 = (pyp - centeryp) / ry;
                const vx2 = (-pxp - centerxp) / rx;
                const vy2 = (-pyp - centeryp) / ry;
                let ang1 = EXPORT.vectorAngle(1, 0, vx1, vy1);
                let ang2 = EXPORT.vectorAngle(vx1, vy1, vx2, vy2);
                if (sweepFlag === 0 && ang2 > 0) {
                    ang2 -= TAU;
                }
                if (sweepFlag === 1 && ang2 < 0) {
                    ang2 += TAU;
                }
                return [centerx, centery, ang1, ang2];
            },
            arcToBezier: ([px, py, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, cx, cy]) => {
                const curves = [];
                if (rx === 0 || ry === 0) {
                    return [];
                }
                const sinphi = Math.sin(xAxisRotation * TAU / 360);
                const cosphi = Math.cos(xAxisRotation * TAU / 360);
                const pxp = cosphi * (px - cx) / 2 + sinphi * (py - cy) / 2;
                const pyp = -sinphi * (px - cx) / 2 + cosphi * (py - cy) / 2;
                if (pxp === 0 && pyp === 0) {
                    return [];
                }
                rx = Math.abs(rx);
                ry = Math.abs(ry);
                const lambda = Math.pow(pxp, 2) / Math.pow(rx, 2) + Math.pow(pyp, 2) / Math.pow(ry, 2);
                if (lambda > 1) {
                    rx *= Math.sqrt(lambda);
                    ry *= Math.sqrt(lambda);
                }
                let [centerx, centery, ang1, ang2] = EXPORT.getArcCenter(px, py, cx, cy, rx, ry, largeArcFlag, sweepFlag, sinphi, cosphi, pxp, pyp);
                const segments = Math.max(Math.ceil(Math.abs(ang2) / (TAU / 4)), 1);
                ang2 /= segments;
                for (let i = 0; i < segments; i++) {
                    curves.push(EXPORT.approxUnitArc(ang1, ang2));
                    ang1 += ang2;
                }
                return curves.map(curve => {
                    const [x1, y1] = EXPORT.mapToEllipse(curve[0].x, curve[0].y, rx, ry, cosphi, sinphi, centerx, centery);
                    const [x2, y2] = EXPORT.mapToEllipse(curve[1].x, curve[1].y, rx, ry, cosphi, sinphi, centerx, centery);
                    const [x, y] = EXPORT.mapToEllipse(curve[2].x, curve[2].y, rx, ry, cosphi, sinphi, centerx, centery);
                    return [x1, y1, x2, y2, x, y];
                });
            }
        }
    });
})(nx);
