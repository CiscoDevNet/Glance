(function(nx) {
    var EXPORT = nx.define("glance.editor.MapStage", nx.lib.svg.Svg, {
        view: {
            cssclass: "glance-editor-stage",
            content: {
                cssstyle: {
                    transform: "{editor.model.matrixActual}"
                },
                capture: "{editor.interactor.boundary}",
                content: [{
                    type: "nx.lib.svg.shape.Rectangle",
                    cssclass: "background-canvas",
                    attributes: {
                        width: "{editor.model.width}",
                        height: "{editor.model.height}"
                    }
                }, {
                    type: "nx.lib.svg.shape.Image",
                    attributes: {
                        width: "{editor.model.width}",
                        height: "{editor.model.height}",
                        href: "{editor.model.backgroundUrl}"
                    },
                    cssstyle: {
                        opacity: "{editor.model.backgroundOpacity}"
                    }
                }, {
                    type: "glance.editor.MapBoundary",
                    properties: {
                        editor: "{editor}",
                        model: "{editor.model.boundary}"
                    }
                }, {
                    repeat: "{editor.model.entities}",
                    content: nx.binding("scope.model", function(model) {
                        return {
                            type: EXPORT.getViewByEntityModel(model),
                            properties: {
                                editor: "{scope.context.editor}",
                                model: model
                            }
                        };
                    })
                }]
            }
        },
        properties: {
            editor: null,
            _scaledStrokeCss: nx.binding("editor.model.scale, editor.model.sizeOfEdgeStroke, editor.model.sizeOfVertexStroke", true, function(async, scale, estroke, vstroke) {
                return nx.util.csssheet.create({
                    ".glance-editor-stage .entity.path .segment > .main": {
                        "stroke-width": estroke / scale
                    },
                    ".glance-editor-stage .entity.path .segment > .vertex": {
                        "stroke-width": vstroke / scale
                    }
                })
            })
        },
        statics: {
            getViewByEntityModel: function(model) {
                if (nx.is(model, glance.editor.model.MapRegionModel)) {
                    return glance.editor.MapRegion;
                }
                if (nx.is(model, glance.editor.model.MapWallModel)) {
                    return glance.editor.MapWall;
                }
                if (nx.is(model, glance.editor.model.MapBarrierModel)) {
                    return glance.editor.MapBarrier;
                }
                if (nx.is(model, glance.editor.model.MapFacilityModel)) {
                    return glance.editor.MapFacility;
                }
            },
            CSS: nx.util.csssheet.create({
                ".glance-editor-stage": {
                    "position": "absolute",
                    "left": "0",
                    "top": "0",
                    "width": "100%",
                    "height": "100%",
                    "font-size": "12px",
                    "font-family": "CiscoSans",
                    "background": "#fff"
                },
                ".glance-editor-stage text": {
                    "font-size": "1em",
                    "fill": "rgba(0,128,255,.5)"
                },
                ".glance-editor-stage .background-canvas": {
                    "fill": "white",
                    "stroke": "#777"
                },
                ".glance-editor-stage .entity.facility": {
                    "fill": "rgba(0,0,0,.1)"
                },
                ".glance-editor-stage .entity.facility.active-true": {
                    "fill": "rgba(0, 186, 176, .1)"
                },
                ".glance-editor-stage .entity.path > .main": {
                    "fill": "rgba(0,0,0,.1)"
                },
                ".glance-editor-stage .entity.path:not(.wall) > .main": {
                    "stroke": "none"
                },
                ".glance-editor-stage .entity.path.wall > .main": {
                    "fill": "none",
                    "stroke": "black"
                },
                ".glance-editor-stage .entity.path.barrier > .main": {
                    "fill": "rgba(0,0,0,.6)"
                },
                ".glance-editor-stage .entity .face": {
                    "fill": "transparent"
                },
                ".glance-editor-stage .entity.path.wall > .face": {
                    "display": "none"
                },
                ".glance-editor-stage .entity:not(.active-true) .face": {
                    "display": "none"
                },
                ".glance-editor-stage .entity.path .segment > .main": {
                    "stroke": "#00bab0",
                    "fill": "none"
                },
                ".glance-editor-stage .entity.path:not(.active-true) .segment > .main": {
                    "display": "none"
                },
                ".glance-editor-stage .entity.path .segment > .vertex": {
                    "stroke": "#00bab0",
                    "fill": "white"
                },
                ".glance-editor-stage .entity.path:not(.active-true) .segment > .vertex": {
                    "display": "none"
                }
            })
        }
    });
})(nx);
