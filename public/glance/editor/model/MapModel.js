(function(nx) {
    var EXPORT = nx.define("glance.editor.model.MapModel", {
        properties: {
            width: 0,
            height: 0,
            backgroundUrl: null,
            boundary: null,
            entrances: function() {
                return new nx.List();
            },
            vertices: function() {
                return new nx.List();
            },
            walls: function() {
                return new nx.List();
            },
            barriers: function() {
                return new nx.List();
            },
            regions: function() {
                return new nx.List();
            },
            facilities: function() {
                return new nx.List();
            }
        },
        methods: {
            getEntrance: function(entrance_id) {
                return this.entrances().find(function(entrance) {
                    return entrance.id() === entrance_id;
                });
            },
            createVertex: function(point, force) {
                var vertices = this.vertices();
                var vertex = !force && vertices.find(function(vertex) {
                    return nx.math.approximate(vertex.x(), point[0]) && nx.math.approximate(vertex.y(), point[1]);
                });
                if (!vertex) {
                    vertex = new glance.editor.model.VertexModel();
                    vertex.x(point[0]);
                    vertex.y(point[1]);
                    vertices.push(vertex);
                }
                return vertex;
            },
            createShape: function(points) {
                var shape = new glance.editor.model.MapShapeModel();
                var vertices = shape.vertices();
                nx.each(points, function(point) {
                    if (!nx.is(point, glance.editor.model.VertexModel)) {
                        point = this.createVertex(point);
                    }
                    vertices.push(point);
                }.bind(this));
                return shape;
            },
            createRegion: function(points, entrance, label) {
                var region = new glance.editor.model.MapRegionModel();
                var vertices = region.vertices();
                nx.each(points, function(point) {
                    if (!nx.is(point, glance.editor.model.VertexModel)) {
                        point = this.createVertex(point);
                    }
                    vertices.push(point);
                }.bind(this));
                region.entrance(entrance);
                region.label(label);
                return region;
            },
            createWall: function(vertex0, vertex1) {
                var wall = new glance.editor.model.MapWallModel();
                wall.vertex0(vertex0);
                wall.vertex1(vertex1);
                return wall;
            },
            createSvgLabel: function(element) {
                var vertex = this.createVertex([element.getAttribute("x") * 1 || 0, element.getAttribute("y") * 1 || 0]);
                var label = new glance.editor.model.MapLabelModel();
                label.vertex(vertex);
                // TODO trim
                label.text(element.innerHTML);
                return label;
            },
            addSvgBoundary: function(element) {
                // TODO clear if old boundary exists
                var shape = this.createShape(EXPORT.getPointsBySvgPolygon(element));
                this.boundary(shape);
                return shape;
            },
            addSvgWall: function(element) {
                var point0 = [element.getAttribute("x1") * 1, element.getAttribute("y1") * 1];
                var point1 = [element.getAttribute("x2") * 1, element.getAttribute("y2") * 1];
                var vertex0 = this.createVertex(point0);
                var vertex1 = this.createVertex(point1);
                var wall = this.createWall(vertex0, vertex1);
                this.walls().push(wall);
                return wall;
            },
            addSvgRegion: function(element) {
                var svgShape, svgLabel;
                svgShape = element.querySelector(".shape");
                svgLabel = element.querySelector(".label");
                if (!svgShape) {
                    return;
                }
                var entrance, label, region;
                entrance = this.getEntrance(element.getAttribute("id"));
                label = svgLabel && this.createSvgLabel(svgLabel);
                region = this.createRegion(EXPORT.getPointsBySvgPolygon(svgShape), entrance, label);
                this.regions().push(region);
                return region;
            },
            addSvgBarrier: function(element) {
                var shape = this.createShape(EXPORT.getPointsBySvgPolygon(element));
                this.barriers().push(shape);
                return shape;
            }
        },
        statics: {
            REGEXP_POINTS: /\s*,\s*|\s+/,
            getPointsBySvgPolygon: function(element) {
                var points = element.getAttribute("points");
                return points.split(EXPORT.REGEXP_POINTS).reduce(function(result, value) {
                    var last = result[result.length - 1];
                    if (!last || last.length > 1) {
                        last = [];
                        result.push(last);
                    }
                    last.push(value * 1 || 0);
                    return result;
                }, []);
            }
        }
    });
})(nx);
