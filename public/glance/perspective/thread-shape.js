/**
 * Created by Jay on 2017/1/10.
 */
var shape = {
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
    sortEdges: function(edge1, edge2) {
        if (edge1.length < edge2.length) {
            return 1;
        } else if (edge1.length > edge2.length) {
            return -1;
        } else {
            return 0;
        }
    },
    handel: function(facesCount, edges, shapeVertices) {
        while (facesCount < 10000) {
            //find the middle point and push it into shapeVertices
            var edge = shape.deepCopy(edges[0]);
            var index1 = edge.vertices[0];
            var index2 = edge.vertices[1];
            var v1 = shapeVertices[index1];
            var v2 = shapeVertices[index2];
            var x = (v1.x + v2.x) / 2;
            var y = (v1.y + v2.y) / 2;
            var v = shape.deepCopy(v1);
            v.x = x;
            v.y = y;
            shapeVertices.push(v);
            var index = shapeVertices.length - 1;
            //create new edge with v
            var nums = [];
            for (var i = 0; i < edge.faces.length; i++) {
                for (var j = 0; j < edge.faces[i].length; j++) {
                    if (edge.faces[i][j] != index1 && edge.faces[i][j] != index2) {
                        nums.push(edge.faces[i][j]);
                    }
                }
            }
            var index3 = nums[0];
            var index4 = nums[1] && nums[1];
            if (index4 != undefined) {
                var deltaX1 = shapeVertices[index].x - shapeVertices[index1].x;
                var deltaY1 = shapeVertices[index].y - shapeVertices[index1].y;
                var length1 = Math.pow(deltaX1 * deltaX1 + deltaY1 * deltaY1, 0.5);
                var edge1 = {
                    vertices: [index, index1],
                    length: length1,
                    faces: [[index, index1, index3], [index, index1, index4]]
                };
                var deltaX2 = shapeVertices[index].x - shapeVertices[index2].x;
                var deltaY2 = shapeVertices[index].y - shapeVertices[index2].y;
                var length2 = Math.pow(deltaX2 * deltaX2 + deltaY2 * deltaY2, 0.5);
                var edge2 = {
                    vertices: [index, index2],
                    length: length2,
                    faces: [[index, index2, index3], [index, index2, index4]]
                };
                var deltaX3 = shapeVertices[index].x - shapeVertices[index3].x;
                var deltaY3 = shapeVertices[index].y - shapeVertices[index3].y;
                var length3 = Math.pow(deltaX3 * deltaX3 + deltaY3 * deltaY3, 0.5);
                var edge3 = {
                    vertices: [index, index3],
                    length: length3,
                    faces: [[index, index3, index1], [index, index3, index2]]
                };
                var deltaX4 = shapeVertices[index].x - shapeVertices[index4].x;
                var deltaY4 = shapeVertices[index].y - shapeVertices[index4].y;
                var length4 = Math.pow(deltaX4 * deltaX4 + deltaY4 * deltaY4, 0.5);
                var edge4 = {
                    vertices: [index, index4],
                    length: length4,
                    faces: [[index, index4, index1], [index, index4, index2]]
                };
                for (var m = 0; m < nums.length; m++) {
                    var num1 = edges.findIndex(function(item) {
                        if ((item.vertices[0] == index1 && item.vertices[1] == nums[m]) || (item.vertices[1] == index1 && item.vertices[0] == nums[m])) {
                            return item;
                        }
                    });
                    var edgeA=shape.deepCopy(edges[num1]);
                    for (var i = 0; i < edgeA.faces.length; i++) {
                        for (var j = 0; j < 3; j++) {
                            if (edgeA.faces[i][j] == index2) {
                                edgeA.faces[i][j] = index;
                            }
                        }
                    }
                    var num2 = edges.findIndex(function(item) {
                        if ((item.vertices[0] == index2 && item.vertices[1] == nums[m]) || (item.vertices[1] == index2 && item.vertices[0] == nums[m])) {
                            return item;
                        }
                    });
                    var edgeB=shape.deepCopy(edges[num2]);
                    for (var i = 0; i < edgeB.faces.length; i++) {
                        for (var j = 0; j < 3; j++) {
                            if (edgeB.faces[i][j] == index1) {
                                edgeB.faces[i][j] = index;
                            }
                        }
                    }
                    edges.splice(num1, 1, edgeA);
                    edges.splice(num2, 1, edgeB);
                }
                edges.shift();
                edges.push(edge1, edge2, edge3, edge4);
                facesCount += 2;
            } else {
                var deltaX1 = shapeVertices[index].x - shapeVertices[index1].x;
                var deltaY1 = shapeVertices[index].y - shapeVertices[index1].y;
                var length1 = Math.pow(deltaX1 * deltaX1 + deltaY1 * deltaY1, 0.5);
                var edge1 = {
                    vertices: [index, index1],
                    length: length1,
                    faces: [[index, index1, index3]]
                };
                var deltaX2 = shapeVertices[index].x - shapeVertices[index2].x;
                var deltaY2 = shapeVertices[index].y - shapeVertices[index2].y;
                var length2 = Math.pow(deltaX2 * deltaX2 + deltaY2 * deltaY2, 0.5);
                var edge2 = {
                    vertices: [index, index2],
                    length: length2,
                    faces: [[index, index2, index3]]
                };
                var deltaX3 = shapeVertices[index].x - shapeVertices[index3].x;
                var deltaY3 = shapeVertices[index].y - shapeVertices[index3].y;
                var length3 = Math.pow(deltaX3 * deltaX3 + deltaY3 * deltaY3, 0.5);
                var edge3 = {
                    vertices: [index, index3],
                    length: length3,
                    faces: [[index, index3, index1], [index, index3, index2]]
                };
                var num1 = edges.findIndex(function(item) {
                    if ((item.vertices[0] == index1 && item.vertices[1] == index3) || (item.vertices[1] == index1 && item.vertices[0] == index3)) {
                        return item;
                    }
                });
                var edgeA=shape.deepCopy(edges[num1]);
                for (var i = 0; i < edgeA.faces.length; i++) {
                    for (var j = 0; j < 3; j++) {
                        if (edgeA.faces[i][j] == index2) {
                            edgeA.faces[i][j] = index;
                        }
                    }
                }
                var num2 = edges.findIndex(function(item) {
                    if ((item.vertices[0] == index2 && item.vertices[1] == index3) || (item.vertices[1] == index2 && item.vertices[0] == index3)) {
                        return item;
                    }
                });
                var edgeB=shape.deepCopy(edges[num2]);
                for (var i = 0; i < edgeB.faces.length; i++) {
                    for (var j = 0; j < 3; j++) {
                        if (edgeB.faces[i][j] == index1) {
                            edgeB.faces[i][j] = index;
                        }
                    }
                }
                edges.splice(num1, 1, edgeA);
                edges.splice(num2, 1, edgeB);
                edges.shift();
                edges.push(edge1, edge2, edge3);
                facesCount += 1;
            }
            edges.sort(shape.sortEdges);
        }
        var faceIndexs = [];
        for (var i = 0; i < edges.length; i++) {
            for (var j = 0; j < edges[i].faces.length; j++) {
                var faceIndex = edges[i].faces[j];
                if (faceIndexs.findIndex(function(item) {
                        for (var a = 0; a < 3; a++) {
                            if (item[0] == faceIndex[a]) {
                                for (var b = 0; b < 3; b++) {
                                    if ((b != a) && (item[1] == faceIndex[b])) {
                                        for (var c = 0; c < 3; c++) {
                                            if ((c != a) && (c != b) && (item[2] == faceIndex[c])) {
                                                return item;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }) == -1) {
                    faceIndexs.push(faceIndex);
                }
            }
        }
        return {faces: faceIndexs, shapeVertices: shapeVertices};
    },
    onmessage: function(message) {
        var result = shape.handel(message.facesCount, message.edges, message.shapeVertices);
        postMessage({
            id: message.id,
            result: result
        })
    }
};
onmessage = function(evt) {
    shape.onmessage(evt.data);
};
