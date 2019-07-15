(function(nx) {
    var EXPORT = nx.define("glance.editor.model.EditorModel", glance.editor.model.MapModel, {
        properties: {
            name: null,
            cpadding: 20,
            cwidth: 0,
            cheight: 0,
            backgroundOpacity: .5,
            matrix: function() {
                return nx.geometry.Matrix.I;
            },
            matrixFit: nx.binding("cpadding, cwidth, cheight, width, height", function(cpadding, cwidth, cheight, width, height) {
                if (cwidth && cheight && width && height) {
                    cpadding = cpadding || 0;
                    var s = Math.min((cwidth - cpadding * 2) / width, (cheight - cpadding * 2) / height); // scale
                    return [
                        [s, 0, 0],
                        [0, s, 0],
                        [cwidth / 2 - s * width / 2, cheight / 2 - s * height / 2, 1]
                    ];
                }
            }),
            matrixActual: nx.binding("matrixFit, matrix", function(fitMatrix, matrix) {
                if (fitMatrix && matrix) {
                    return nx.geometry.Matrix.multiply(fitMatrix, matrix);
                }
            }),
            scale: nx.binding("matrixActual.0.0"), // TODO
            sizeOfVertexStroke: 1,
            sizeOfEdgeStroke: 3,
            sizeOfVertex: 5,
            sizeOfControlPoint: 4,
            scaledSizeOfVertex: nx.binding("sizeOfVertex, scale", function(size, scale) {
                return size / scale;
            }),
            scaledSizeOfControlPoint: nx.binding("sizeOfControlPoint, scale", function(size, scale) {
                return size / scale;
            }),
            mode: "idle",
            active: null,
            temporary: null,
            entities: nx.binding("walls, barriers, regions, facilities", true, function(async, walls, barriers, regions, facilities) {
                if (walls && barriers && regions && facilities) {
                    var union = nx.List.union([regions, walls, barriers, facilities]);
                    union.retain(union.monitorContaining(function(item) {
                        if (!item.map) {
                            nx.Object.extendProperty(item, "map", {
                                value: this
                            }, true);
                            nx.Object.extendProperty(item, "active", {
                                value: nx.binding("map.active", function(active) {
                                    return this === active;
                                })
                            }, true);
                        }
                    }.bind(this)));
                    // XXX currently JavaScript treat true/false as 1/0
                    var sorting = nx.List.sorting(union, "__class__.__namespace__, active", function(type1, active1, type2, active2) {
                        active1 = active1 * 10 + EXPORT.ENTITY_TYPES.indexOf(type1);
                        active2 = active2 * 10 + EXPORT.ENTITY_TYPES.indexOf(type2);
                        return active1 - active2;
                    });
                    sorting.retain(union);
                    async.set(sorting);
                    return sorting;
                }
            }),
            _extendBoundary: {
                dependencies: "boundary",
                value: function(boundary) {
                    if (boundary) {
                        nx.Object.extendProperty(boundary, "map", {
                            value: this
                        }, true);
                        nx.Object.extendProperty(boundary, "active", {
                            value: nx.binding("map.active", function(active) {
                                return this === active;
                            })
                        }, true);
                    }
                }
            },
            _releaseTemporary: {
                dependencies: "mode",
                value: function(mode) {
                    this.release("temporary");
                    this.temporary(null);
                }
            }
        },
        statics: {
            ENTITY_TYPES: [
                "glance.editor.model.MapRegionModel",
                "glance.editor.model.MapWallModel",
                "glance.editor.model.MapBarrierModel",
                "glance.editor.model.MapFacilityModel"
            ],
            getModelBySvg: function(svg) {
                var model = new EXPORT();
                // update size
                var size = nx.lib.svg.Svg.getSvgSize(svg);
                model.width(size.width);
                model.height(size.height);
                // update contents
                var svgBoundary, svgWalls, svgRegions, svgBarriers;
                // boundary
                svgBoundary = svg.querySelector(".boundary");
                model.addSvgBoundary(svgBoundary);
                // walls
                svgWalls = svg.querySelectorAll(".wall");
                nx.each(svgWalls, function(svgWall) {
                    model.addSvgWall(svgWall);
                });
                // regions
                svgRegions = svg.querySelectorAll(".region");
                nx.each(svgRegions, function(svgRegion) {
                    model.addSvgRegion(svgRegion);
                });
                // barriers
                svgBarriers = svg.querySelectorAll(".barrier");
                nx.each(svgBarriers, function(svgBarrier) {
                    model.addSvgBarrier(svgBarrier);
                });
                // result
                return model;
            },
            getSvgByModel: function(model) {
                // SVG
                var svg = new nx.lib.svg.Svg();
                svg.setAttribute("viewBox", [0, 0, model.width(), model.height()].join(" "));
                // Boundary
                var polygon = new nx.lib.svg.shape.Polygon();
                polygon.toggleClass("boundary");
                polygon.setAttribute("points", model.boundary().vertices().data().map(function(vertex) {
                    return vertex.x() + "," + vertex.y();
                }).join(" "));
                svg.append(polygon);
                // Regions
                nx.each(model.regions(), function(region) {
                    var g, polygon, text;
                    // polygon
                    polygon = new nx.lib.svg.shape.Polygon();
                    polygon.toggleClass("shape");
                    polygon.setAttribute("points", region.vertices().data().map(function(vertex) {
                        return vertex.x() + "," + vertex.y();
                    }).join(" "));
                    // text
                    text = new nx.lib.svg.shape.Text();
                    // TODO text style
                    text.toggleClass("label");
                    text.setAttribute("x", region.label().vertex().x());
                    text.setAttribute("y", region.label().vertex().y());
                    text.append(region.label().text());
                    // region
                    g = new nx.lib.svg.Node();
                    g.toggleClass("region");
                    g.append(polygon);
                    g.append(text);
                    // append
                    svg.append(g);
                });
                nx.each(model.walls(), function(wall) {
                    var line;
                    line = new nx.lib.svg.shape.Line();
                    line.toggleClass("wall");
                    line.setAttribute("x1", wall.vertex0().x());
                    line.setAttribute("y1", wall.vertex0().y());
                    line.setAttribute("x2", wall.vertex1().x());
                    line.setAttribute("y2", wall.vertex1().y());
                    // TODO line style
                    svg.append(line);
                });
                nx.each(model.barriers(), function(barrier) {
                    var polygon;
                    // polygon
                    polygon = new nx.lib.svg.shape.Polygon();
                    polygon.toggleClass("barrier");
                    polygon.setAttribute("points", barrier.vertices().data().map(function(vertex) {
                        return vertex.x() + "," + vertex.y();
                    }).join(" "));
                    // append
                    svg.append(polygon);
                });
                nx.each(model.facilities(), function(facilities) {
                    circle = new nx.lib.svg.shape.Circle();
                });
                return svg;
            },
            getMaskBySvg: function(source) {
                var svg = source.cloneNode(true);
                if (!svg.tagName || svg.tagName.toLowerCase() !== "svg") {
                    svg = svg.querySelector("svg");
                }
                var size = nx.lib.svg.Svg.getSvgSize(svg);
                var canvas = document.createElement("canvas");
                canvas.width = size.width;
                canvas.height = size.height;
                var style_node = document.createElement("style");
                style_node.setAttribute("type", "text/css");
                style_node.setAttribute("media", "screen");
                style_node.setAttribute("rel", "stylesheet");
                style_node.appendChild(document.createTextNode(nx.util.csssheet.css({
                    "svg": {
                        "stroke": "transparent !important",
                        "fill": "transparent !important"
                    },
                    ".wall": {
                        "stroke": "black !important"
                    },
                    ".barrier": {
                        "fill": "black !important"
                    }
                })));
                svg.appendChild(style_node);
                var image = document.createElement("img");
                image.src = nx.lib.svg.Svg.serialize(svg);
                canvas.getContext("2d").drawImage(image, 0, 0);
                return canvas.toDataURL();
            }
        }
    });
})(nx);
