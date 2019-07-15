(function(nx) {
    var EXPORT = nx.define("glance.editor.EditorLoader", nx.ui.Element, {
        view: {
            cssclass: "glance-editor-loading",
            content: "Loading ..."
        },
        properties: {
            session: null,
            model: null,
            view: nx.binding("model", true, function(async, model) {
                var view;
                if (!model) {
                    async.set(this);
                } else {
                    view = new glance.editor.Editor();
                    view.model(model);
                    async.set(view);
                    return view;
                }
            })
        },
        methods: {
            loadOld: function(mapUrl) {
                var resources = new nx.Object();
                resources.retain(glance.model.map.MapLoader.load(mapUrl, function(map) {
                    var emodel = EXPORT.getEditorModelByPerspectiveModel(map);
                    this.model(emodel);
                }.bind(this)));
                return resources;
            },
            load: function(url) {
                return nx.util.ajax({
                    url: url,
                    success: function(resources, svg) {
                        svg = glance.common.Util.getRealSvg(svg);
                        var emodel = EXPORT.getEditorModelBySvg(svg);
                        this.model(emodel);
                    }.bind(this)
                });
            }
        },
        statics: {
            getSvgByEditorModel: function(model) {
                return nx.singleton(nx.lib.svg.Svg, {
                    view: {
                        cssclass: "mask-{mask}",
                        attributes: {
                            viewBox: nx.binding("model.width, model.height", function(width, height) {
                                if (width && height) {
                                    return [0, 0, width, height].join(" ");
                                }
                            })
                        },
                        properties: {
                            width: "{model.width}",
                            height: "{model.height}"
                        },
                        content: [{
                            name: "style",
                            type: "nx.lib.svg.SvgStyle",
                            content: nx.util.csssheet.css({
                                "svg": {
                                    "background": 'url(\'data:image/svg+xml;utf-8,<svg style="fill:white;" width="20" height="20" viewBox="0 0 20 20"><path d="M0,0L10,0L10,20L20,20L20,10L0,10Z" fill="#eee" stroke="none" /></svg>\')'
                                },
                                "svg.mask-true": {
                                    "background": "black"
                                },
                                ".boundary": {
                                    "stroke": "none",
                                    "fill": "rgba(255,255,255,1)"
                                },
                                ".region": {
                                    "stroke": "black",
                                    "stroke-width": "1px",
                                    "stroke-dasharray": "5,5",
                                    "fill": "none"
                                },
                                "svg.mask-true .region": {
                                    "stroke": "white"
                                },
                                ".wall": {
                                    "stroke": "rgba(0,0,0,1)",
                                    "fill": "none"
                                },
                                ".barrier": {
                                    "stroke": "none",
                                    "fill": "rgba(0,0,0,1)"
                                }
                            })
                        }, {
                            type: "nx.lib.svg.shape.Path",
                            cssclass: "boundary",
                            attributes: {
                                d: "{model.boundary.def}"
                            }
                        }, {
                            repeat: "{model.entities}",
                            type: "nx.lib.svg.shape.Path",
                            cssclass: nx.binding("scope.model", function(model) {
                                if (nx.is(model, "glance.editor.model.MapRegionModel")) {
                                    return "region";
                                }
                                if (nx.is(model, "glance.editor.model.MapWallModel")) {
                                    return "wall";
                                }
                                if (nx.is(model, "glance.editor.model.MapBarrierModel")) {
                                    return "barrier";
                                }
                            }),
                            cssstyle: {
                                "stroke-width": nx.binding("scope.model.stroke.width", function(width) {
                                    return (width * 1 ? width : "0") + "px";
                                })
                            },
                            attributes: {
                                d: "{scope.model.def}"
                            }
                        }]
                    },
                    properties: {
                        model: model,
                        mask: false
                    },
                    methods: {
                        getMaskDataUrl: function(callback) {
                            this.mask(true);
                            var canvas = document.createElement("canvas");
                            var ctx = canvas.getContext("2d");
                            canvas.width = this.width();
                            canvas.height = this.height();
                            var img = new Image();
                            img.onload = function() {
                                ctx.drawImage(img, 0, 0);
                                // pull the entire image into an array of pixel data
                                var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                                // examine every pixel, change any old rgb to the new-rgb
                                for (var i = 0; i < imageData.data.length; i += 4) {
                                    // replace white to transparent
                                    if (imageData.data[i] == 255 && imageData.data[i + 1] == 255 && imageData.data[i + 2] == 255 && imageData.data[i + 3] == 255) {
                                        // change to your new rgb
                                        imageData.data[i] = 0;
                                        imageData.data[i + 1] = 0;
                                        imageData.data[i + 2] = 0;
                                        imageData.data[i + 3] = 0;
                                    }
                                }
                                // put the altered data back on the canvas
                                ctx.putImageData(imageData, 0, 0);
                                var maskUrl = canvas.toDataURL();
                                this.mask(false);
                                callback(maskUrl);
                            }.bind(this);
                            img.src = nx.lib.svg.Svg.serialize(this.dom());
                        }
                    }
                });
            },
            getSvgMapByEditoModel: function(model, callback) {
                var svg = EXPORT.getSvgByEditorModel(model);
                var svgUrl = nx.lib.svg.Svg.serialize(svg.dom());
                return svg.getMaskDataUrl(function(maskUrl) {
                    callback([svgUrl, maskUrl]);
                });
            },
            getEditorModelBySvg: function(svg) {
                return glance.common.Util.withSvgAttaching(svg, function(svg, size) {
                    var emodel = new glance.editor.model.EditorModel();
                    emodel.width(size.width);
                    emodel.height(size.height);
                    var elements = svg.querySelectorAll("rect, polygon, path, circle, line, polyline, ellipse");
                    nx.each(elements, function(element) {
                        var model, id, name, icon, position, fill, stroke;
                        if (element.tagName.toLowerCase() === "circle" && element.getAttribute("type") === "facility") {
                            // facility
                            [name, icon] = ["id", "icon"].map(element.getAttribute.bind(element));
                            position = ["cx", "cy"].map(element.getAttribute.bind(element)).map(function(v) {
                                return v * 1 || 0;
                            });
                            position = new glance.editor.model.VertexModel(position[0], position[1]);
                            model = new glance.editor.model.MapFacilityModel();
                            nx.sets(model, {
                                name: name,
                                icon: icon,
                                position: position
                            });
                            emodel.facilities().push(model);
                        } else {
                            [fill, stroke] = [glance.editor.model.SvgColorModel.getFillColorByElement(element), glance.editor.model.SvgStrokeModel.getStrokeByElement(element)];
                            if (!fill || fill.a() == 0) {
                                // no fill or completely transparent
                                if (stroke && stroke.color() && stroke.color().a() > 0 && stroke.width() != 0) {
                                    // and has stroke
                                    if (stroke.dasharray() != "0px" && stroke.dasharray() !== "none") {
                                        // dashed stroke: zone
                                        model = new glance.editor.model.MapRegionModel(element);
                                        emodel.regions().push(model);
                                    } else {
                                        // solid stroke: wall
                                        model = new glance.editor.model.MapWallModel(element);
                                        emodel.walls().push(model);
                                    }
                                }
                            } else {
                                // filled, ignore stroke
                                if (fill.r() == 1 && fill.g() == 1 && fill.b() == 1) {
                                    // completely white: boundary
                                    model = new glance.editor.model.MapRegionModel(element);
                                    emodel.boundary(model);
                                } else {
                                    // other: barrier
                                    model = new glance.editor.model.MapBarrierModel(element);
                                    emodel.barriers().push(model);
                                }
                            }
                        }
                    });
                    return emodel;
                });
            },
            getEditorModelByPerspectiveModel: function(map) {
                var emodel = new glance.editor.model.EditorModel();
                var areas = [
                    ["boundary", map.shape()]
                ].concat(map.terrains().toArray().map(function(item) {
                    return [nx.path(item, "category"), nx.path(item, "shape")];
                }));
                nx.each(areas, function([category, shape]) {
                    var model, defs, segments;
                    switch (category) {
                        case "barrier":
                        case "furnish":
                        case "block":
                            model = new glance.editor.model.MapBarrierModel();
                            emodel.barriers().push(model);
                            break;
                        case "boundary":
                            model = new glance.editor.model.MapRegionModel();
                            emodel.boundary(model);
                            break;
                        case "region":
                        case "zone":
                            model = new glance.editor.model.MapRegionModel();
                            model.name(category + " " + nx.serial());
                            emodel.regions().push(model);
                            break;
                        case "wall":
                            model = new glance.editor.model.MapWallModel();
                            emodel.walls().push(model);
                            break;
                    }
                    // add points
                    defs = EXPORT.getDefsByCurves(shape.curves);
                    segments = glance.editor.model.SvgPathModel.getSegmentsByDefArray(defs);
                    model.segments().pushAll(segments);
                });
                emodel.width(map.width());
                emodel.height(map.height());
                return emodel;
            },
            getDefsByCurves: function(curves) {
                var i, curve, v, vp, defs = [];
                for (vp = [0, 0], i = 0; i < curves.length; i++) {
                    curve = curves[i];
                    switch (curve.constructor) {
                        // TODO other curve types
                        case THREE.LineCurve:
                            if (defs.length === 0 || curve.v1.x !== vp[0] || curve.v1.y !== vp[1]) {
                                defs.push(["M", [curve.v1.x, curve.v1.y]]);
                            }
                            defs.push(["L", [curve.v2.x, curve.v2.y]]);
                            vp = [curve.v2.x, curve.v2.y];
                            break;
                    }
                }
                return defs;
            },
            getDefaultEditorModel: function() {
                var model = new glance.editor.model.EditorModel();
                model.width(1024);
                model.height(768);
                return model;
            },
            CSS: nx.util.csssheet.create({
                ".glance-editor-loading": {
                    "position": "absolute",
                    "left": "0",
                    "right": "0",
                    "top": "0",
                    "bottom": "0",
                    "width": "200px",
                    "height": "200px",
                    "text-align": "center",
                    "line-height": "200px",
                    "margin": "auto"
                }
            })
        }
    });
})(nx);
