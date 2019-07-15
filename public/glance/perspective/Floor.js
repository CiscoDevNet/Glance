(function(nx) {
    var extrudeHeights = {
        block: 1,
        furnish: .5,
        zone: .01
    };
    var MATERIAL_ZONE = new THREE.MeshFaceMaterial([
        new THREE.MeshPhongMaterial({
            color: 0x0,
            transparent: true,
            opacity: .2,
            side: THREE.DoubleSide
        }),
        new THREE.MeshPhongMaterial({
            color: 0xf7931e,
            transparent: true,
            side: THREE.DoubleSide
        })
    ]);
    var EXPORT = nx.define("glance.perspective.Floor", sanvy.Object, {
        sanvy: {
            properties: {
                "object.position.z": "{altitude}",
                "object.position.x": nx.binding("model.map.width", function(width) {
                    return -width / 2;
                }),
                "object.position.y": nx.binding("model.map.height", function(height) {
                    return -height / 2;
                })
            },
            content: [
                nx.binding("model.map.shape", function(shape) {
                    if (shape) {
                        return {
                            type: "sanvy.Mesh",
                            name: "background",
                            properties: {
                                "object.geometry": new THREE.ShapeGeometry(shape),
                                "object.material": nx.binding("model.map.texture", function(texture) {
                                    var material;
                                    if (texture) {
                                        material = new THREE.MeshPhongMaterial({
                                            map: texture,
                                            transparent: true,
                                            side: THREE.DoubleSide
                                        });
                                    } else {
                                        material = new THREE.MeshPhongMaterial({
                                            color: 0xeeeeee,
                                            specular: 0x050505,
                                            transparent: true,
                                            opacity: .6,
                                            side: THREE.DoubleSide
                                        });
                                    }
                                    return material;
                                })
                            }
                        };
                    }
                }), {
                    repeat: "{model.blocks}",
                    type: "sanvy.Mesh",
                    properties: {
                        "object.visible": "{scope.context.model.world.showBlock}",
                        "object.geometry": nx.binding("scope.model.shape, scope.context.height", true, function(async, shape, height) {
                            if (shape && height) {
                                var geometry;
                                shape.autoClose = false;
                                geometry = new sanvy.ext.ExtraExtrudeGeometry(shape, {
                                    amount: (extrudeHeights["block"]) * height,
                                    lid: THREE.FrontSide
                                });
                                async.set(geometry);
                            }
                        }),
                        "object.material": nx.binding("scope.model.color", true, function(async, color) {
                            color && async.set(new THREE.MeshPhongMaterial({
                                color: 0xffffff,
                                transparent: true,
                                opacity: .5,
                                side: THREE.DoubleSide
                            }));
                        })
                    }
                }, {
                    repeat: "{model.furnishes}",
                    type: "sanvy.Mesh",
                    properties: {
                        "object.visible": "{scope.context.model.world.showFurnish}",
                        "object.geometry": nx.binding("scope.model.shape, scope.context.height", true, function(async, shape, height) {
                            if (shape && height) {
                                var geometry;
                                shape.autoClose = false;
                                geometry = new sanvy.ext.ExtraExtrudeGeometry(shape, {
                                    amount: (extrudeHeights["furnish"]) * height,
                                    lid: THREE.FrontSide
                                });
                                async.set(geometry);
                            }
                        }),
                        "object.material": nx.binding("scope.model.color", true, function(async, color) {
                            color && async.set(new THREE.MeshPhongMaterial({
                                color: 0xffffff,
                                transparent: true,
                                opacity: .9,
                                side: THREE.DoubleSide
                            }));
                        })
                    }
                }, {
                    repeat: "{model.zones}",
                    type: "sanvy.Mesh",
                    properties: {
                        model: "{scope.model}",
                        "object.visible": "{scope.context.model.world.showZone}",
                        "object.position.z": nx.binding("scope.context.height", function(height) {
                            return height * 0.01 || 0;
                        }),
                        "object.geometry": nx.binding("scope.model.shape, scope.context.height", true, function(async, shape, height) {
                            if (shape && height) {
                                var geometry;
                                shape.autoClose = false;
                                geometry = new sanvy.ext.ExtraExtrudeGeometry(shape, {
                                    amount: (extrudeHeights["zone"]) * height,
                                    bevelSize: height * 0.03,
                                    material: 0,
                                    extrudeMaterial: 1,
                                    lid: THREE.FrontSide
                                });
                                async.set(geometry);
                            }
                        }),
                        "object.material": MATERIAL_ZONE
                    },
                    content: [{
                        properties: {
                            "object.position.x": "{scope.model.position.0}",
                            "object.position.y": "{scope.model.position.1}",
                        },
                        content: {
                            type: "glance.perspective.MarkLabel",
                            properties: {
                                model: "{scope.model}",
                                slop: "{scope.context.slop}",
                                rotation: "{scope.context.rotation}",
                                size: nx.binding("scope.context.iconSize"),
                                height: nx.binding("scope.context.height", function(height) {
                                    return height * 2.5;
                                })
                            }
                        }
                    }]
                }, {
                    repeat: "{model.facilities}",
                    properties: {
                        model: "{scope.model}",
                        "object.visible": "{scope.context.model.world.showFacility}",
                        "object.position.x": "{scope.model.position.0}",
                        "object.position.y": "{scope.model.position.1}"
                    },
                    content: [{
                        type: "glance.perspective.MarkIcon",
                        properties: {
                            model: "{scope.model}",
                            slop: "{scope.context.slop}",
                            rotation: "{scope.context.rotation}",
                            size: nx.binding("scope.context.iconSize"),
                            height: nx.binding("scope.context.height", function(height) {
                                return height * 2.5;
                            })
                        }
                    }]
                }, {
                    repeat: "{model.things}",
                    properties: {
                        "object.visible": "{scope.context.model.world.showThing}",
                        "object.position.x": "{scope.model.position.0}",
                        "object.position.y": "{scope.model.position.1}"
                    },
                    content: [{
                        type: "glance.perspective.MarkImage",
                        properties: {
                            model: "{scope.model}",
                            slop: "{scope.context.slop}",
                            rotation: "{scope.context.rotation}",
                            showImage: "{scope.context.model.world.showImage}",
                            size: nx.binding("scope.context.iconSize"),
                            height: nx.binding("scope.context.height", function(height) {
                                return height * 1.5;
                            })
                        }
                    }]
                }, {
                    repeat: "{model.persons}",
                    properties: {
                        "object.visible": "{scope.context.model.world.showPerson}",
                        "object.position.x": "{scope.model.position.0}",
                        "object.position.y": "{scope.model.position.1}"
                    },
                    content: [{
                        type: "glance.perspective.MarkImage",
                        properties: {
                            model: "{scope.model}",
                            slop: "{scope.context.slop}",
                            rotation: "{scope.context.rotation}",
                            showImage: "{scope.context.model.world.showImage}",
                            size: nx.binding("scope.context.iconSize"),
                            height: nx.binding("scope.context.height", function(height) {
                                return height * 1.5;
                            })
                        }
                    }]
                }, {
                    type: "glance.perspective.Heatmap3D",
                    properties: {
                        "object.visible": "{model.world.showHeatmap}",
                        "width": "{model.world.building.width}",
                        "depth": "{model.world.building.depth}",
                        "height": nx.binding("height", function(height) {
                            return height * 3;
                        }),
                        "density": "{model.density}",
                        "shape": "{model.map.shape}"
                    }
                },
                nx.binding("height, routeSegment.points, textureRoute", true, function(async, height, points, texture) {
                    if (points && height > 0 && texture) {
                        var geometry = EXPORT.toBeltGeometry(points, height);
                        var material = new THREE.MeshPhongMaterial({
                            map: texture,
                            emissive: new THREE.Color(1, .4, .1),
                            color: 0xffffff,
                            transparent: true,
                            side: THREE.DoubleSide
                        });
                        var mesh = new THREE.Mesh(geometry, material);
                        async.set({
                            properties: {
                                "object": mesh
                            }
                        });
                    }
                }),
                nx.binding("height, routeSegment.points, texturePipeRoute", true, function(async, height, points, texture) {
                    if (points && height > 0 && texture) {
                        var pipeGeometry = EXPORT.toPipeGeometry(points, height);
                        var pipeMatrial = new THREE.MeshPhongMaterial({
                            map: texture,
                            color: 0xffffff,
                            transparent: true,
                        });
                        var pipeMesh = new THREE.Mesh(pipeGeometry, pipeMatrial);
                        async.set({
                            properties: {
                                "object": pipeMesh
                            }
                        });
                    }
                })
            ]
        },
        properties: {
            model: null,
            activated: false,
            rotation: 0,
            slop: 0,
            height: 0,
            iconSize: nx.binding("model.world.iconSize"),
            routeSegment: null,
            personPositions: nx.binding("model.persons", function(persons) {
                return persons && nx.List.mapping(persons, "position");
            }),
            textureRoute: nx.binding("height, routeSegment.points", true, function(async, height, points) {
                if (!this.retain("textureRoute") && points) {
                    var resources = new nx.Object();
                    resources.retain(nx.ui.tag.Image.load(EXPORT.BELT, function(result) {
                        var image = result.image;
                        var [width, height] = [image.width, image.height];
                        var texture = new THREE.Texture(image);
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.repeat.set(1 / 2, 1);
                        // update texture with timer
                        var timeStart = nx.date.now();
                        resources.retain(nx.util.paint(function(now) {
                            texture.offset.x = (1 - (now - timeStart) % EXPORT.BELT_CYCLE / EXPORT.BELT_CYCLE) / 2;
                            texture.needsUpdate = true;
                        }));
                        // FIXME release texture
                        async.set(texture);
                    }));
                    this.retain("textureRoute", resources);
                }
            }),
            texturePipeRoute: nx.binding("height, routeSegment.points", true, function(async, height, points) {
                if (!this.retain("texturePipeRoute") && points) {
                    var resources = new nx.Object();
                    resources.retain(nx.ui.tag.Image.load(EXPORT.PIPE, function(result) {
                        var image = result.image;
                        var [width, height] = [image.width, image.height];
                        var texture = new THREE.Texture(image);
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.repeat.set(4, 4);
                        // update texture with timer
                        var timeStart = nx.date.now();
                        resources.retain(nx.util.paint(function(now) {
                            texture.offset.x = (1 - (now - timeStart) % EXPORT.BELT_CYCLE / EXPORT.BELT_CYCLE) / 2;
                            texture.needsUpdate = true;
                        }));
                        // FIXME release texture
                        async.set(texture);
                    }));
                    this.retain("texturePipeRoute", resources);
                }
            }),

        },
        statics: {
            extrudeHeights: extrudeHeights,
            BELT: "glance/nav-arrow.png",
            PIPE: "glance/nav-pipe.png",
            BELT_CYCLE: 1500,
            BELT_LENGTH: 256,
            BELT_HEIGHT: 64,
            toBeltGeometry: function(points, height) {
                var i, p1, p2, d1, d2, geometry = new THREE.Geometry();

                var uvrate = EXPORT.BELT_HEIGHT * 3 / height / EXPORT.BELT_LENGTH;
                p1 = points[0], d1 = 0;

                geometry.vertices.push(new THREE.Vector3(p1[0], p1[1], 0));
                geometry.vertices.push(new THREE.Vector3(p1[0], p1[1], height));
                // get total length of the belt
                for (i = 1; i < points.length; i++, p1 = p2, d1 = d2) {
                    p2 = points[i];
                    d2 = d1 + nx.geometry.Line.getDistance(p1[0], p1[1], p2[0], p2[1]);
                    // add vertices
                    geometry.vertices.push(new THREE.Vector3(p2[0], p2[1], 0));
                    geometry.vertices.push(new THREE.Vector3(p2[0], p2[1], height));
                    // add faces

                    geometry.faces.push(new THREE.Face3(i * 2 - 2, i * 2 - 1, i * 2));
                    geometry.faceVertexUvs[0].push([
                        new THREE.Vector2(d1 * uvrate, 3),
                        new THREE.Vector2(d1 * uvrate, 0),
                        new THREE.Vector2(d2 * uvrate, 3)
                    ]);
                    geometry.faces.push(new THREE.Face3(i * 2 - 1, i * 2, i * 2 + 1));
                    geometry.faceVertexUvs[0].push([
                        new THREE.Vector2(d1 * uvrate, 0),
                        new THREE.Vector2(d2 * uvrate, 3),
                        new THREE.Vector2(d2 * uvrate, 0),
                    ]);
                }
                geometry.uvsNeedUpdate = true;
                return geometry;
            },
            toPipeGeometry: function(points, height) {
                var pointsArr = [];
                for (var i = 0; i < points.length; i++) {
                    pointsArr.push(new THREE.Vector3(points[i][0], points[i][1], height * 9 / 8));
                }
                var pipeSpline = new THREE.CatmullRomCurve3(pointsArr);

                var pipeGeometry = new THREE.TubeGeometry(pipeSpline, 64, height / 16, 20, false);
                return pipeGeometry;
            }
        }
    });

})(nx);
