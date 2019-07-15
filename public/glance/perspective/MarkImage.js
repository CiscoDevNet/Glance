(function(nx) {

    var EXPORT = nx.define("glance.perspective.MarkImage", glance.perspective.Mark, {
        sanvy: {
            extend: {
                markContent: {
                    content: [{
                        type: "sanvy.Mesh",
                        properties: {
                            "object.visible": "{showDot}",
                            "object.geometry": nx.binding("radiusDot", function(radius) {
                                return new THREE.RingGeometry(radius * .7, radius, 32);
                            }),
                            "object.material": nx.binding("radiusDot", function(radius) {
                                return new THREE.MeshPhongMaterial({
                                    color: 0xf8f8f8,
                                    side: THREE.DoubleSide
                                });
                            })
                        }
                    }, {
                        type: "sanvy.Mesh",
                        properties: {
                            "object.visible": "{showDot}",
                            "object.geometry": nx.binding("radiusDot", function(radius) {
                                return new THREE.CircleGeometry(radius * .7, 32);
                            }),
                            "object.material": nx.binding("radiusDot, model.color", function(radius, color) {
                                if (radius) {
                                    return new THREE.MeshPhongMaterial({
                                        color: color || 0x00C2B9,
                                        side: THREE.DoubleSide
                                    });
                                }
                            })
                        }
                    }, {
                        type: "sanvy.Mesh",
                        properties: {
                            "object.visible": "{showImage}",
                            "object.geometry": nx.binding("radius", function(radius) {
                                return new THREE.RingGeometry(radius * .9, radius, 32);
                            }),
                            "object.material": nx.binding("radius, model.active", function(radius, active) {
                                return new THREE.MeshPhongMaterial({
                                    color: active ? EXPORT.COLOR_ACTIVE : EXPORT.COLOR_INACTIVE,
                                    side: THREE.DoubleSide
                                });
                            })
                        }
                    }, {
                        type: "sanvy.Mesh",
                        properties: {
                            "object.visible": "{showImage}",
                            "object.geometry": nx.binding("radius", function(radius) {
                                return new THREE.CircleGeometry(radius * .9, 32);
                            }),
                            "object.material": nx.binding("photoMaterial", true, function(async, material) {
                                material && async.set(material);
                            })
                        }
                    }]
                }
            }
        },
        properties: {
            showImage: true,
            showDot: nx.binding("showImage", function(showImage) {
                return !showImage;
            }),
            radiusDot: nx.binding("size", function(size) {
                return size / 6;
            }),
            radius: nx.binding("size", function(size) {
                return size / 3;
            }),
            image: {
                dependencies: "model.category, model.id, model.avatarVersion",
                async: true,
                value: function(async, category, id, avatarVersion) {
                    if (category) {
                        if (category === "expert" || category === "guest" || category === "thing" ) {
                            if (id) {
                                var url = glance.service.api.getSmallAvatarUrl(this.model()) + "?x=" + avatarVersion;
                                return nx.ui.tag.Image.load(url, function(result) {
                                    if (result.success) {
                                        async.set(result.image);
                                    }
                                });
                            }
                        } else {
                            return nx.ui.tag.Image.load("icons/" + category + ".png", function(result) {
                                if (result.success) {
                                    async.set(result.image);
                                }
                            });
                        }
                    }
                }
            },
            photoMaterial: {
                dependencies: "image",
                async: true,
                value: function(async, image) {
                    if (image) {
                        var material = EXPORT.getPhotoMaterial(image);
                        async.set(material);
                        return {
                            release: function() {
                                material.dispose();
                            }
                        };
                    }
                }
            }
        },
        statics: {
            COLOR_ACTIVE: 0xf7931e,
            COLOR_INACTIVE: 0xf8f8f8,
            PHOTO_SIZE: 128,
            getPhotoObjectTempCanvas: (function() {
                var canvas;
                return function() {
                    canvas = canvas || document.createElement("canvas");
                    canvas.width = canvas.height = EXPORT.PHOTO_SIZE;
                    canvas.ctx = canvas.getContext("2d");
                    return canvas;
                };
            })(),
            getPhotoMaterial: function(image) {
                var scale, data, canvas = EXPORT.getPhotoObjectTempCanvas();
                if (image.width >= image.height) {
                    scale = EXPORT.PHOTO_SIZE / image.height;
                    canvas.ctx.drawImage(image, (image.width - image.height) / 2, 0, image.height, image.height, 0, 0, EXPORT.PHOTO_SIZE, EXPORT.PHOTO_SIZE);
                    data = canvas.ctx.getImageData(0, 0, EXPORT.PHOTO_SIZE, EXPORT.PHOTO_SIZE);
                } else {
                    scale = EXPORT.PHOTO_SIZE / image.width;
                    canvas.ctx.drawImage(image, 0, (image.height - image.width) / 2, image.width, image.width, 0, 0, EXPORT.PHOTO_SIZE, EXPORT.PHOTO_SIZE);
                    data = canvas.ctx.getImageData(0, 0, EXPORT.PHOTO_SIZE, EXPORT.PHOTO_SIZE);
                }
                var texture = new THREE.Texture(data);
                texture.needsUpdate = true;
                return new THREE.MeshPhongMaterial({
                    map: texture,
                    side: THREE.DoubleSide
                });
            }
        }
    });

})(nx);
