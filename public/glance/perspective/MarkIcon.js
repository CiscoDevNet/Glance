(function(nx) {

    var EXPORT = nx.define("glance.perspective.MarkIcon", glance.perspective.Mark, {
        sanvy: {
            extend: {
                markContent: {
                    content: [{
                        type: "sanvy.Mesh",
                        properties: {
                            "object.geometry": nx.binding("radius", function(radius) {
                                return new THREE.PlaneGeometry(radius * 2, radius * 2);
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
            radius: nx.binding("size", function(size) {
                return size / 3;
            }),
            image: {
                dependencies: "model.category, model.imagePath",
                async: true,
                value: function(async, category, imagePath) {
                    if (category && imagePath) {
                        if (category === "facility") {
                            return nx.ui.tag.Image.load(imagePath, function(result) {
                                if (result.success) {
                                    async.set(result.image);
                                }
                            });
                        }
                    }
                    return null;
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
                    return null;
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
                    transparent: true,
                    side: THREE.DoubleSide
                });
            }
        }
    });

})(nx);
