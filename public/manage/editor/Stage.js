(function (nx) {
    var sqrt = Math.sqrt;
    var abs = Math.abs;
    var EXPORT = nx.define("devme.manage.editor.Stage", nx.lib.svg.Svg, {
        view: {
            cssclass: "glance-editor-stage",
            content: [{
                cssclass: "stage",
                cssstyle: {
                    transform: "{matrix}"
                },
                content: [{
                    repeat: "{model.polygons}",
                    type: "devme.manage.editor.Polygon",
                    cssclass: "polygon",
                    properties: {
                        model: "{scope.model}"
                    },
                    capture: {
                        tap: function (sender, evt) {
                            var context = this.scope().context();
                            var model = context.model();
                            if (!model.activeAction()) {
                                var wall = this.scope().model();
                                var polygon = context.getPolygonByWall(wall);
                                if (polygon) {
                                    var action = new devme.manage.editor.model.ActionModel();
                                    action.type("polygon");
                                    action.vertices().pushAll(polygon.vertices().toArray());
                                    model.activeAction(action);
                                } else {
                                    var action = new devme.manage.editor.model.ActionModel();
                                    action.type("edge");
                                    action.vertices().pushAll([wall.start(), wall.end()]);
                                    model.activeAction(action);
                                }
                            }
                        },
                        drag: function () {
                            // TODO
                        }
                    }
                }, {
                    repeat: "{model.walls}",
                    type: "devme.manage.editor.Wall",
                    cssclass: "wall",
                    properties: {
                        model: "{scope.model}"
                    },
                    capture: {
                        tap: function (sender, evt) {
                            var context = this.scope().context();
                            var model = context.model();
                            if (!model.activeAction()) {
                                var wall = this.scope().model();
                                var polygon = context.getPolygonByWall(wall);
                                if (polygon) {
                                    var action = new devme.manage.editor.model.ActionModel();
                                    action.type("polygon");
                                    action.vertices().pushAll(polygon.vertices().toArray());
                                    model.activeAction(action);
                                } else {
                                    var action = new devme.manage.editor.model.ActionModel();
                                    action.type("edge");
                                    action.vertices().pushAll([wall.start(), wall.end()]);
                                    model.activeAction(action);
                                }
                            }
                        },
                        drag: function () {
                            // TODO
                        }
                    }
                }, {
                    repeat: "{model.activeAction.edges}",
                    type: "devme.manage.editor.Wall",
                    cssclass: "temporary wall",
                    properties: {
                        model: "{scope.model}"
                    }
                }, {
                    repeat: "{model.activeAction.vertices}",
                    type: "devme.manage.editor.Point",
                    cssclass: "temporary point",
                    properties: {
                        model: "{scope.model}"
                    },
                    capture: {
                        tap: function (sender, evt) {
                            var context = this.scope().context();
                            var capture = context.capture();
                            if (capture && capture.tapPoint) {
                                capture.tapPoint.call(context, this, evt);
                            }
                        },
                        drag: function (sender, evt) {
                            var position = this.scope().context().transformPosition(evt.capturedata.position.slice());
                            var model = this.scope().model();
                            model.x(position[0]);
                            model.y(position[1]);
                        }
                    }
                }]
            }],
            capture: "{capture}"
        },
        properties: {
            matrix: null,
            model: null,
            bound: null,
            capture: {
                dependencies: "model.activeAction.type",
                value: function (type) {
                    if (type) {
                        return nx.binding("capture_" + type);
                    }
                }
            },
            capture_edge: function () {
                return {
                    tap: function () {
                        this.model().activeAction(null);
                    }
                };
            },
            capture_polygon: function () {
                return {
                    tap: function () {
                        this.model().activeAction(null);
                    }
                };
            },
            capture_region: function () {
                return {
                    tap: function (sender, evt) {
                        var model = this.model();
                        var action = model.activeAction();
                        var points = action.vertices();
                        var point = new devme.manage.editor.model.VertexModel.Vertex();
                        var position = this.transformPosition(evt.capturedata.position.slice());
                        point.id(nx.uuid(true));
                        point.x(position[0]);
                        point.y(position[1]);
                        points.push(point);
                        if (points.length() > 1) {
                            var walls = action.edges();
                            var wall = new devme.manage.editor.model.EdgeModel.Edge();
                            wall.id(nx.uuid());
                            wall.start(points.get(points.length() - 2));
                            wall.end(points.get(points.length() - 1));
                            walls.push(wall);
                        }
                    },
                    tapPoint: function (point, evt) {
                        var model = this.model();
                        var action = model.activeAction();
                        if (point.scope().index() === 0 || point.scope().index() === point.scope().count() - 1) {
                            this.addPolygon(action.vertices(), action.edges());
                            // FIXME add the action to undo-list
                            // clear the action
                            model.activeAction(null);
                        }
                    }
                };
            },
            capture_wall: function () {
                return {
                    tap: function (sender, evt) {
                        var model = this.model();
                        var action = model.activeAction();
                        var points = action.vertices();
                        var point = new devme.manage.editor.model.VertexModel.Vertex();
                        var position = this.transformPosition(evt.capturedata.position.slice());
                        point.id(nx.uuid(true));
                        point.x(position[0]);
                        point.y(position[1]);
                        points.push(point);
                        if (points.length() > 1) {
                            var wall = new devme.manage.editor.model.EdgeModel.Edge();
                            wall.id(nx.uuid());
                            wall.start(points.get(points.length() - 2));
                            wall.end(points.get(points.length() - 1));
                            this.addWall(wall);
                            model.activeAction(null);
                        }
                    }
                };
            },
            capture_door: function () {
                return {
                    tap: function (sender, evt) {
                        var model = this.model();
                        var action = model.activeAction();
                        var points = action.vertices();
                        var position = this.transformPosition(evt.capturedata.position.slice());
                        var wallInfo = this.getWallByPosition(position);
                        var wall, start, end, x, y;
                        if (!points.length()) {
                            if (wallInfo.closest.distance < 5) {
                                model.activeAction(null);
                            } else {
                                wall = wallInfo.wall;
                                start = wall.start(), end = wall.end();
                                x = wallInfo.closest.x, y = wallInfo.closest.y;
                            }
                        }

                        var point = new devme.manage.editor.model.VertexModel.Vertex();
                        point.id(nx.uuid(true));
                        point.x(position[0]);
                        point.y(position[1]);
                        points.push(point);
                        if (points.length() > 1) {
                            var wall = new devme.manage.editor.model.EdgeModel.Edge();
                            wall.id(nx.uuid());
                            wall.start(points.get(points.length() - 2));
                            wall.end(points.get(points.length() - 1));
                            this.addWall(wall);
                            model.activeAction(null);
                        }
                    }
                };
            }
        },
        methods: {
            addPolygon: function (vertices, edges) {
                var polygon = new devme.manage.editor.model.EdgeModel.Polygon();
                polygon.id(nx.uuid(true));
                nx.each(vertices, function (vertex) {
                    polygon.vertices().push(vertex);
                });
                nx.each(edges, function (edge) {
                    polygon.edges().push(edge);
                });
                this.model().vertexList().pushAll(vertices.toArray());
                this.model().polygonList().push(polygon);
                return polygon;
            },
            addWall: function (edge) {
                this.model().vertexList().pushAll([edge.start(), edge.end()]);
                this.model().edgeList().push(edge);
            },
            transformPosition: function (position) {
                var bound = this.bound();
                var matrix = nx.geometry.Matrix.inverse(this.model().matrix());
                position[0] -= bound.left;
                position[1] -= bound.top;
                return nx.geometry.Vector.transform(position, matrix);
            },
            getPositionByEvent: function (evt) {
                return this.transformPosition([evt.clientX, evt.clientY]);
            },
            getPolygonByWall: function (wall) {
                return this.model().polygonList().find(function (polygon) {
                    return polygon.edges().contains(wall);
                });
            },
            getWallByPosition: function (position, least) {
                var result, distance;
                var matrix = this.model().matrix();
                var x0, y0;
                x0 = position[0], y0 = position[1];
                this.model().walls().each(function (wall) {
                    var start, end, info, distance;
                    // segment: start--end
                    start = wall.start(), end = wall.end();
                    info = nx.geometry.Line.getPointToSegment(x0, y0, start.x(), start.y(), end.x(), end.y());
                    if (info) {
                        distance = info.closest.distance;
                        if (!least || distance < least * matrix[0][0]) {
                            if (!result || distance < result.closest.distance) {
                                result = {
                                    wall: wall,
                                    pedal: info.pedal,
                                    closest: info.closest
                                };
                            }
                        }
                    }
                });
                return result;
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-editor-stage line": {
                    "stroke": "black",
                    "stroke-linecap": "round"
                },
                ".glance-editor-stage line.temporary": {},
                ".glance-editor-stage .point.temporary": {
                    "fill": "#fff",
                    "stroke": "#f00",
                    "stroke-width": "0.2"
                }
            })
        }
    });
})(nx);
