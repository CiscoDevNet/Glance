(function(nx) {
    var rPath = /(?:\s*,\s*)?(?:([ZzMmLlHhVvCcSsQqTtAa])((?:(?:\s*,\s*)?[+-]?(?:\d*\.)?\d+(?:[eE][+-]?(?:\d*\.)?\d+)?)*))/g;
    var rDigits = /[+-]?(?:\d*\.)?\d+(?:[eE][+-]?(?:\d*\.)?\d+)?/g;
    var TAU = Math.PI * 2;

    var EXPORT = nx.define("glance.editor.model.SvgPathModel", {
        properties: {
            element: null,
            stroke: null,
            fill: null,
            segments: function() {
                return new nx.List();
            },
            def: nx.binding("segments", true, function(async, segments) {
                if (segments) {
                    var defs = nx.List.mapping(segments, "def");
                    defs.retain(defs.monitorDiff(function() {
                        async.set(defs.toArray().join(""));
                    }));
                    return defs;
                }
            }),
            vertices: nx.binding("segments", true, function(async, segments) {
                if (segments) {
                    var sources = nx.List.mapping(segments, "vertices");
                    var cross = nx.List.union(sources);
                    cross.retain(sources);
                    async.set(cross);
                    return cross;
                }
            })
        },
        methods: {
            init: function(element) {
                this.inherited();
                if (element) {
                    this.stroke(glance.editor.model.SvgStrokeModel.getStrokeByElement(element));
                    this.fill(glance.editor.model.SvgColorModel.getFillColorByElement(element));
                    this.segments().pushAll(EXPORT.getSegmentsByElement(element));
                }
            },
            toElement: function(options) {
                // TODO
                var def = this.def();
                var path = document.createElement("path", nx.lib.svg.Svg.DEFAULT_XML_NAMESPACE);
                path.setAttribute("d", def);
                nx.each(options, function(value, key) {
		    // TODO
                    switch (key) {
                        case "stroke":
                        case "stroke-width":
                        case "fill":
                            nx.util.cssstyle.set(path, key, value);
                            break;
                    }
                });
                return path;
            }
        },
        statics: {
            SEGMENTS: {
                M: nx.define({
                    properties: {
                        operation: "M",
                        start: null,
                        end: null,
                        def: nx.binding("end.x, end.y", function(x, y) {
                            return ["M", x, y].join(" ");
                        }),
                        vertices: function() {
                            return new nx.List();
                        }
                    }
                }),
                L: nx.define({
                    properties: {
                        operation: "L",
                        start: null,
                        end: null,
                        def: nx.binding("end.x, end.y", function(x, y) {
                            return ["L", x, y].join(" ");
                        }),
                        vertices: nx.binding("start, end", function(start, end) {
                            var list = new nx.List();
                            start && list.push(start);
                            end && list.push(end);
                            return list;
                        })
                    }
                }),
                C: nx.define({
                    properties: {
                        operation: "C",
                        start: null,
                        end: null,
                        startControl: null,
                        endControl: null,
                        def: nx.binding("startControl.x, startControl.y, endControl.x, endControl.y, end.x, end.y", function(x1, y1, x2, y2, x, y) {
                            return ["C", x1, y1, x2, y2, x, y].join(" ");
                        }),
                        vertices: nx.binding("start, startControl, endControl, end", function(start, startControl, endControl, end) {
                            var list = new nx.List();
                            start && list.push(start);
                            startControl && list.push(startControl);
                            endControl && list.push(endControl);
                            end && list.push(end);
                            return list;
                        })
                    }
                }),
                A: nx.define({
                    properties: {
                        operation: "A",
                        start: null,
                        end: null,
                        xradius: null,
                        yradius: null,
                        rotation: null,
                        large: 0,
                        clockwise: 0,
                        def: nx.binding("xradius, yradius, rotation, large, clockwise, end.x, end.y", function(xr, yr, r, large, clockwise, x, y) {
                            return ["A", xr, yr, r, large ? 1 : 0, clockwise ? 1 : 0, x, y].join(" ");
                        }),
                        vertices: nx.binding("start, end", function(start, end) {
                            var list = new nx.List();
                            start && list.push(start);
                            end && list.push(end);
                            return list;
                        })
                    }
                })
            },
            getStrokeByElement: function(element) {
                // TODO
                return null;
            },
            getFillByElement: function(element) {
                // TODO
                return null;
            },
            getSegmentsByElement: function(element, matrix) {
                // TODO handle matrix
                var tag = element.tagName.toLowerCase();
                var stroke, fill, defs;
                switch (tag) {
                    case "path":
                        defs = EXPORT.SVG.getDefArrayByPath(element);
                        break;
                    case "rect":
                        defs = EXPORT.SVG.getDefArrayByRect(element);
                        break;
                    case "circle":
                        defs = EXPORT.SVG.getDefArrayByCircle(element);
                        break;
                    case "ellipse":
                        defs = EXPORT.SVG.getDefArrayByEllipse(element);
                        break;
                    case "polygon":
                        defs = EXPORT.SVG.getDefArrayByPolygon(element);
                        break;
                    case "line":
                        defs = EXPORT.SVG.getDefArrayByLine(element);
                        break;
                    case "polyline":
                        defs = EXPORT.SVG.getDefArrayByPolyline(element);
                        break;
                }
                return EXPORT.getSegmentsByDefArray(defs);
            },
            getSegmentsByDefArray: function(defs) {
                var i, def, v, s, s0, sp, result = [];
                // comment: s0 for first vertex
                // comment: sp for previous vertex
                for (i = 0; i < defs.length; i++) {
                    def = defs[i];
                    switch (def[0]) {
                        case "m":
                            s = new EXPORT.SEGMENTS.M();
                            v = sp ? sp.end() : new glance.editor.model.VertexModel(0, 0);
                            s.start(v);
                            v = new glance.editor.model.VertexModel(v.x() + def[1][0], v.y() + def[1][1]);
                            s.end(v);
                            s0 = sp = s;
                            break;
                        case "M":
                            s = new EXPORT.SEGMENTS.M();
                            v = sp ? sp.end() : new glance.editor.model.VertexModel(0, 0);
                            s.start(v);
                            v = new glance.editor.model.VertexModel(def[1][0], def[1][1]);
                            s.end(v);
                            s0 = sp = s;
                            break;
                        case "l":
                            s = new EXPORT.SEGMENTS.L();
                            v = sp ? sp.end() : new glance.editor.model.VertexModel(0, 0);
                            s.start(v);
                            v = new glance.editor.model.VertexModel(v.x() + def[1][0], v.y() + def[1][1]);
                            s.end(v);
                            sp = s;
                            break;
                        case "L":
                            s = new EXPORT.SEGMENTS.L();
                            v = sp ? sp.end() : new glance.editor.model.VertexModel(0, 0);
                            s.start(v);
                            v = new glance.editor.model.VertexModel(def[1][0], def[1][1]);
                            s.end(v);
                            sp = s;
                            break;
                        case "h":
                            s = new EXPORT.SEGMENTS.L();
                            v = sp ? sp.end() : new glance.editor.model.VertexModel(0, 0);
                            s.start(v);
                            v = new glance.editor.model.VertexModel(v.x() + def[1][0], v.y());
                            s.end(v);
                            sp = s;
                            break;
                        case "H":
                            s = new EXPORT.SEGMENTS.L();
                            v = sp ? sp.end() : new glance.editor.model.VertexModel(0, 0);
                            s.start(v);
                            v = new glance.editor.model.VertexModel(def[1][0], v.y());
                            s.end(v);
                            sp = s;
                            break;
                        case "v":
                            s = new EXPORT.SEGMENTS.L();
                            v = sp ? sp.end() : new glance.editor.model.VertexModel(0, 0);
                            s.start(v);
                            v = new glance.editor.model.VertexModel(v.x(), v.y() + def[1][0]);
                            s.end(v);
                            sp = s;
                            break;
                        case "V":
                            s = new EXPORT.SEGMENTS.L();
                            v = sp ? sp.end() : new glance.editor.model.VertexModel(0, 0);
                            s.start(v);
                            v = new glance.editor.model.VertexModel(v.x(), def[1][0]);
                            s.end(v);
                            sp = s;
                            break;
                        case "a":
                            s = new EXPORT.SEGMENTS.A();
                            v = sp ? sp.end() : new glance.editor.model.VertexModel(0, 0);
                            s.start(v);
                            s.xradius(def[1][0]);
                            s.yradius(def[1][1]);
                            s.rotation(def[1][2]);
                            s.large(def[1][3]);
                            s.clockwise(def[1][4]);
                            v = new glance.editor.model.VertexModel(v.x() + def[1][5], v.y() + def[1][6]);
                            s.end(v);
                            sp = s;
                            break;
                        case "A":
                            s = new EXPORT.SEGMENTS.A();
                            v = sp ? sp.end() : new glance.editor.model.VertexModel(0, 0);
                            s.start(v);
                            s.xradius(def[1][0]);
                            s.yradius(def[1][1]);
                            s.rotation(def[1][2]);
                            s.large(def[1][3]);
                            s.clockwise(def[1][4]);
                            v = new glance.editor.model.VertexModel(def[1][5], def[1][6]);
                            s.end(v);
                            sp = s;
                            break;
                        case "c":
                            s = new EXPORT.SEGMENTS.C();
                            v = sp ? sp.end() : new glance.editor.model.VertexModel(0, 0);
                            s.start(v);
                            v = new glance.editor.model.VertexModel(s.start().x() + def[1][0], s.start().y() + def[1][1]);
                            s.startControl(v);
                            v = new glance.editor.model.VertexModel(s.start().x() + def[1][2], s.start().y() + def[1][3]);
                            s.endControl(v);
                            v = new glance.editor.model.VertexModel(s.start().x() + def[1][4], s.start().y() + def[1][5]);
                            s.end(v);
                            sp = s;
                            break;
                        case "C":
                            s = new EXPORT.SEGMENTS.C();
                            v = sp ? sp.end() : new glance.editor.model.VertexModel(0, 0);
                            s.start(v);
                            v = new glance.editor.model.VertexModel(def[1][0], def[1][1]);
                            s.startControl(v);
                            v = new glance.editor.model.VertexModel(def[1][2], def[1][3]);
                            s.endControl(v);
                            v = new glance.editor.model.VertexModel(def[1][4], def[1][5]);
                            s.end(v);
                            sp = s;
                            break;
                        case "s":
                            if (!sp || !nx.is(sp, EXPORT.SEGMENTS.C)) {
                                throw new Error("Bad path definition");
                            }
                            s = new EXPORT.SEGMENTS.C();
                            s.start(sp.end());
                            v = new glance.editor.model.VertexModel(sp.end().x() * 2 - sp.endControl().x(), sp.end().y() * 2 - sp.endControl().y());
                            s.startControl(v);
                            v = new glance.editor.model.VertexModel(s.start().x() + def[1][0], s.start().y() + def[1][1]);
                            s.endControl(v);
                            v = new glance.editor.model.VertexModel(s.start().x() + def[1][2], s.start().y() + def[1][3]);
                            s.end(v);
                            sp = s;
                            break;
                        case "S":
                            if (!sp || !nx.is(sp, EXPORT.SEGMENTS.C)) {
                                throw new Error("Bad path definition");
                            }
                            s = new EXPORT.SEGMENTS.C();
                            s.start(sp.end());
                            v = new glance.editor.model.VertexModel(sp.end().x() * 2 - sp.endControl().x(), sp.end().y() * 2 - sp.endControl().y());
                            s.startControl(v);
                            v = new glance.editor.model.VertexModel(def[1][0], def[1][1]);
                            s.endControl(v);
                            v = new glance.editor.model.VertexModel(def[1][2], def[1][3]);
                            s.end(v);
                            sp = s;
                            break;
                        case "q":
                            s = new EXPORT.SEGMENTS.C();
                            v = sp ? sp.end() : new glance.editor.model.VertexModel(0, 0);
                            s.start(v);
                            v = new glance.editor.model.VertexModel(s.start().x() + def[1][0], s.start().y() + def[1][1]);
                            s.startControl(v);
                            s.endControl(v);
                            v = new glance.editor.model.VertexModel(s.start().x() + def[1][2], s.start().y() + def[1][3]);
                            s.end(v);
                            sp = s;
                            break;
                        case "Q":
                            s = new EXPORT.SEGMENTS.C();
                            v = sp ? sp.end() : new glance.editor.model.VertexModel(0, 0);
                            s.start(v);
                            v = new glance.editor.model.VertexModel(def[1][0], def[1][1]);
                            s.startControl(v);
                            s.endControl(v);
                            v = new glance.editor.model.VertexModel(def[1][2], def[1][3]);
                            s.end(v);
                            sp = s;
                            break;
                        case "t":
                            if (!sp || !nx.is(sp, EXPORT.SEGMENTS.C)) {
                                throw new Error("Bad path definition");
                            }
                            s = new EXPORT.SEGMENTS.C();
                            s.start(sp.end());
                            v = new glance.editor.model.VertexModel(sp.end().x() * 2 - sp.endControl().x(), sp.end().y() * 2 - sp.endControl().y());
                            s.startControl(v);
                            s.endControl(v);
                            v = new glance.editor.model.VertexModel(s.start().x() + def[1][0], s.start().y() + def[1][1]);
                            s.end(v);
                            sp = s;
                            break;
                        case "T":
                            if (!sp || !nx.is(sp, EXPORT.SEGMENTS.C)) {
                                throw new Error("Bad path definition");
                            }
                            s = new EXPORT.SEGMENTS.C();
                            s.start(sp.end());
                            v = new glance.editor.model.VertexModel(sp.end().x() * 2 - sp.endControl().x(), sp.end().y() * 2 - sp.endControl().y());
                            s.startControl(v);
                            s.endControl(v);
                            v = new glance.editor.model.VertexModel(def[1][0], def[1][1]);
                            s.end(v);
                            sp = s;
                            break;
                        case "z":
                        case "Z":
                            s = new EXPORT.SEGMENTS.L();
                            v = sp ? sp.end() : new glance.editor.model.VertexModel(0, 0);
                            s.start(v);
                            v = s0 ? s0.end() : new glance.editor.model.VertexModel(0, 0);
                            s.end(v);
                            sp = s;
                            break;
                    }
                    result.push(s);
                }
                return result;
            },
            SVG: {
                // FIXME circle/ellipse trouble under matrix
                getDefArrayByPath: function(element) {
                    var d = element.getAttribute("d");
                    var defs = [];
                    d.replace(rPath, function(matched, g1, g2, idx) {
                        defs.push([g1, (g2.match(rDigits) || []).map(function(v) {
                            return v * 1;
                        })]);
                    });
                    return defs;
                },
                getDefArrayByRect: function(element) {
                    var [x, y, width, height] = ["x", "y", "width", "height"].map(element.getAttribute.bind(element)).map(function(v) {
                        return v * 1 || 0;
                    });
                    return [
                        ["M", [x, y]],
                        ["L", [x, y + height]],
                        ["L", [x + width, y + height]],
                        ["L", [x + width, y]],
                        ["Z"]
                    ];
                },
                getDefArrayByCircle: function(element) {
                    var [x, y, r] = ["cx", "cy", "r"].map(element.getAttribute.bind(element)).map(function(v) {
                        return v * 1 || 0;
                    });
                    return [
                        ["M", [x - r, y]],
                        ["A", [r, r, 0, 0, 0, x + r, y]],
                        ["A", [r, r, 0, 0, 0, x - r, y]]
                    ];
                },
                getDefArrayByEllipse: function(element) {
                    var [x, y, rx, ry] = ["cx", "cy", "rx", "ry"].map(element.getAttribute.bind(element)).map(function(v) {
                        return v * 1 || 0;
                    });
                    return [
                        ["M", [x - rx, y]],
                        ["A", [rx, ry, 0, 0, 0, x + rx, y]],
                        ["A", [rx, ry, 0, 0, 0, x - rx, y]]
                    ];
                },
                getDefArrayByPolygon: function(element) {
                    var digits = element.getAttribute("points").match(rDigits).map(function(v) {
                        return v * 1 || 0;
                    });
                    var result = [
                        ["M", [digits.shift(), digits.shift()]]
                    ];
                    while (digits.length) {
                        result.push(["L", [digits.shift(), digits.shift()]]);
                    }
                    result.push(["Z"]);
                    return result;
                },
                getDefArrayByPolyline: function(element) {
                    var digits = element.getAttribute("points").match(rDigits).map(function(v) {
                        return v * 1 || 0;
                    });
                    var result = [
                        ["M", [digits.shift(), digits.shift()]]
                    ];
                    while (digits.length) {
                        result.push(["L", [digits.shift(), digits.shift()]]);
                    }
                    return result;
                },
                getDefArrayByLine: function(element) {
                    var [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map(element.getAttribute.bind(element)).map(function(v) {
                        return v * 1 || 0;
                    });
                    return [
                        ["M", [x1, y1]],
                        ["L", [x2, y2]]
                    ];
                }
            }
        }
    });
})(nx);
