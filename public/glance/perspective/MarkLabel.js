(function(nx) {

    var EXPORT = nx.define("glance.perspective.MarkLabel", glance.perspective.Mark, {
        sanvy: {
            extend: {
                markContent: {
                    content: [{
                        type: "sanvy.Mesh",
                        properties: {
                            "object.geometry": nx.binding("radius", function(radius) {
                                return new THREE.RingGeometry(radius * .7, radius, 32);
                            }),
                            "object.material": nx.binding("radius", function(radius) {
                                return new THREE.MeshPhongMaterial({
                                    color: 0xf8f8f8,
                                    side: THREE.DoubleSide
                                });
                            })
                        }
                    }, {
                        type: "sanvy.Mesh",
                        properties: {
                            "object.geometry": nx.binding("radius", function(radius) {
                                return new THREE.CircleGeometry(radius * .7, 32);
                            }),
                            "object.material": nx.binding("radius, model.color", true, function(async, radius, color) {
                                if (radius && color) {
                                    async.set(new THREE.MeshPhongMaterial({
                                        color: 0x00C2B9,
                                        side: THREE.DoubleSide
                                    }));
                                }
                            })
                        }
                    }, {
                        properties: {
                            object: nx.binding("model.name, height, radius", true, function(async, text, height, radius) {
                                if (text && height && radius) {
                                    var fontSize = radius * 1.1;
                                    var geometry = new THREE.TextGeometry(text, {
                                        font: sanvy.Stage.FONTS.CiscoSansBold,
                                        size: fontSize,
                                        height: 1,
                                        curveSegments: 4,
                                        bevelEnabled: true,
                                        bevelSize: fontSize / 10,
                                        material: 0,
                                        extrudeMaterial: 1
                                    });
                                    var material = new THREE.MeshFaceMaterial([new THREE.MeshPhongMaterial({
                                        color: 0xf8f8f8
                                    }), new THREE.MeshPhongMaterial({
                                        color: 0x000000
                                    })]);
                                    var mesh = new THREE.Mesh(geometry, material);
                                    mesh.position.x = radius * 1.5;
                                    mesh.position.y = -fontSize / 2;
                                    async.set(mesh);
                                }
                            })
                        }
                    }, {
                        properties: {
                            object: nx.binding("model.count,height,radius", true, function(async, count, height, radius) {
                                if ((count != undefined) && height && radius) {
                                    var fontSize = radius * 0.6;
                                    var geometry = new THREE.TextGeometry(count, {
                                        font: sanvy.Stage.FONTS.CiscoSansBold,
                                        size: fontSize,
                                        height: 1,
                                        curveSegments: 4,
                                        bevelEnabled: true,
                                        bevelSize: fontSize / 10,
                                        material: 0,
                                        extrudeMaterial: 1
                                    });
                                    var material = new THREE.MeshFaceMaterial([new THREE.MeshPhongMaterial({
                                        color: 0xf8f8f8
                                    }), new THREE.MeshPhongMaterial({
                                        color: 0x000000
                                    })]);
                                    var mesh = new THREE.Mesh(geometry, material);
                                    mesh.position.x = radius * 2.3;
                                    mesh.position.y = -radius * 1.6;
                                    async.set(mesh);
                                }
                            })
                        }
                    }, {
                        properties: {
                            object: nx.binding("height,radius", true, function(async, height, radius) {
                                if (height && radius) {
                                    var shape = glance.model.map.MapLoader.getShapeInfoByPathD("M.64,7.25 V4.76 a.57.57,0,0,1-.39-.54 V2.47 a.58.58,0,0,1,.58-.58 h.51 a.86.86,0,1,1,.73,0 h.51 a.58.58,0,0,1,.58.58 V4.22 a.58.58,0,0,1-.39.55 V7.25 Z").shape;
                                    var geometry = new sanvy.ext.ExtraExtrudeGeometry(shape, {
                                        amount: -radius * 0.00001,
                                        bevel: false,
                                        bevelSize: radius * 0.0001,
                                        material: 1,
                                        extrudeMaterial: 0
                                    });
                                    var material = new THREE.MeshFaceMaterial([
                                        new THREE.MeshPhongMaterial({
                                            color: 0xf8f8f8
                                        }),
                                        new THREE.MeshPhongMaterial({
                                            color: 0x000000
                                        })
                                    ]);
                                    var mesh = new THREE.Mesh(geometry, material);
                                    mesh.position.x = radius * 2.1;
                                    mesh.position.y = -radius * 0.8;
                                    mesh.rotation.set(0, 0, Math.PI);
                                    mesh.scale.set(radius * 0.13, radius * 0.13, radius * 0.13);
                                    async.set(mesh);
                                    return mesh;
                                }
                            })
                        }
                    }]
                }
            }
        },
        properties: {
            radius: nx.binding("size", function(size) {
                return size / 6;
            })
        }
    });

})(nx);
