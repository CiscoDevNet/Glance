/**
 * Created by Jay on 2017/1/11.
 */
(function(nx) {

    var EXPORT = nx.define("glance.perspective.Heatmap3D", sanvy.Object, {
        sanvy: {
            content: [{
                name: "mesh",
                properties: {
                    "object": nx.binding("geometry", function(geometry) {
                        if (!geometry) {
                            return;
                        }
                        var material = new THREE.MeshBasicMaterial({
                            side: THREE.DoubleSide,
                            transparent: true,
                            opacity: 0.93,
                            vertexColors: THREE.VertexColors
                        });
                        // geometry.elementsNeedUpdate = true;
                        return new THREE.Mesh(geometry, material);
                    })
                }
            }]
        },
        properties: {
            width: 0,
            depth: 0,
            height: 0,
            density: null,
            shape: null,
            geometry: {
                value: nx.binding("dividedShape", function(dividedShape) {
                    if (!dividedShape) {
                        return;
                    }
                    //third step:create geometry by shapeVertices/edges/facesCount
                    var dividedVertices = nx.clone(dividedShape.shapeVertices, true);
                    var dividedFaces = nx.clone(dividedShape.faces, true);
                    var geometry = new THREE.Geometry();
                    dividedVertices.forEach(function(element, index, array) {
                        var x = element.x;
                        var y = element.y;
                        array[index] = new THREE.Vector3(x, y, 10);
                    });
                    geometry.vertices = dividedVertices;
                    dividedFaces.forEach(function(item, index, array) {
                        var face = new THREE.Face3(item[0], item[1], item[2]);
                        var color = new THREE.Color(0x6464ff);
                        face.vertexColors[0] = color;
                        face.vertexColors[1] = color;
                        face.vertexColors[2] = color;
                        geometry.faces.push(face);
                    });
                    geometry.elementsNeedUpdate = true;
                    return geometry;
                })
            },
            isOk: {
                value: nx.binding("geometry", function(geometry) {
                    if (!geometry) {
                        return false;
                    }
                    return true;
                })
            },
            dividedShape: {
                value: nx.binding("shape", true, function(async, shape) {
                    if (!shape) {
                        return;
                    }
                    //first step:divide shape by THREE then create edges
                    var shapeVertices = [];
                    var edges = [];
                    for (var i = 0; i < shape.extractPoints().shape.length - 1; i++) {
                        shapeVertices.push(shape.extractPoints().shape[i]);
                    }
                    var faces = THREE.ShapeUtils.triangulateShape(shapeVertices, shape.extractPoints().holes);
                    var facesCount = faces.length;
                    for (var i = 0; i < faces.length; i++) {
                        for (var j = 0; j < faces[i].length; j++) {
                            for (var k = 0; k < faces[i].length; k++) {
                                if (j != k) {
                                    var indexInEdges = edges.findIndex(function(item) {
                                        return ((item.vertices[0] == faces[i][j] && item.vertices[1] == faces[i][k]) || (item.vertices[0] == faces[i][k] && item.vertices[1] == faces[i][j]));
                                    });
                                    if (indexInEdges == -1) {
                                        var deltaX = shapeVertices[faces[i][j]].x - shapeVertices[faces[i][k]].x;
                                        var deltaY = shapeVertices[faces[i][j]].y - shapeVertices[faces[i][k]].y;
                                        var length = Math.pow(deltaX * deltaX + deltaY * deltaY, 0.5);
                                        var edge = {
                                            vertices: [faces[i][j], faces[i][k]],
                                            length: length,
                                            faces: [faces[i]]
                                        };
                                        edges.push(edge);
                                    } else if (edges[indexInEdges].faces.findIndex(function(item) {
                                            return item === faces[i];
                                        }) == -1) {
                                        edges[indexInEdges].faces.push(faces[i]);
                                    }
                                }
                            }
                        }
                    }
                    edges.sort(EXPORT.sortEdges);
                    //second step:divide shape into n triangles by myself then change shapeVertices/edges/facesCount
                    EXPORT.SHAPER.divideShape(this, facesCount, edges, shapeVertices, function(value) {
                        async.set(value);
                    });
                })
            },
            wave: {
                value: nx.binding("density,depth,height, isOk", true, function(async, density, depth, height, isOk) {
                    if (!density || !isOk) {
                        return;
                    }
                    var object = this.mesh().object();
                    if (!object) {
                        return;
                    }
                    var vertices = nx.clone(object.geometry.vertices, true);
                    EXPORT.HEATER.getHeatByDensity(this, vertices, density, depth, height, function(value) {
                        async.set(value);
                    });
                }),
                watcher: function(pathname, value) {
                    var object = this.mesh().object();
                    if (value && object) {
                        for (var i = 0; i < object.geometry.vertices.length; i++) {
                            object.geometry.vertices[i].z = value[i].z;
                        }
                        for (var i = 0; i < object.geometry.faces.length; i++) {
                            var a = object.geometry.faces[i].a;
                            var b = object.geometry.faces[i].b;
                            var c = object.geometry.faces[i].c;
                            object.geometry.faces[i].vertexColors[0] = EXPORT.getColor(value[a].hslColor);
                            object.geometry.faces[i].vertexColors[1] = EXPORT.getColor(value[b].hslColor);
                            object.geometry.faces[i].vertexColors[2] = EXPORT.getColor(value[c].hslColor);
                        }
                        //update the geometry
                        object.geometry.elementsNeedUpdate = true;
			// make the stage dirty
                        this.stage() && this.stage().dirty(true);
                    }
                }
            }
        },
        statics: {
            HEATER: new glance.perspective.Heater(),
            SHAPER: new glance.perspective.Shaper(),
            getColor: function(hslColor) {
                var color = new THREE.Color(0xffffff);
                color.setHSL(hslColor[0], hslColor[1], hslColor[2]);
                return color;
            },
            sortEdges: function(edge1, edge2) {
                if (edge1.length < edge2.length) {
                    return 1;
                } else if (edge1.length > edge2.length) {
                    return -1;
                } else {
                    return 0;
                }
            }
        }
    });

})(nx);
