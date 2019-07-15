(function(nx) {
    var EXPORT = nx.define("glance.editor.SvgStage", nx.lib.svg.Svg, {
        view: {
            cssclass: "svg-stage",
            content: {
                cssstyle: {
                    transform: "{editor.model.matrixActual}"
                },
		content: [{
		    repeat: "{editor.model.entities}",
		    content: nx.binding("scope.model.view, scope.model", function(view, model){

		    })
		}]
            }
        },
        properties: {
	    editor: null
        },
        statics: {
            getViewByEntityModel: function(model) {
                if (nx.is(model, glance.editor.model.MapRegionModel)) {
                    return glance.editor.MapRegion;
                }
                if (nx.is(model, glance.editor.model.MapWallModel)) {
                    return glance.editor.MapWall;
                }
                if (nx.is(model, glance.editor.model.MapShapeModel)) {
                    return glance.editor.MapBarrier;
                }
                if (nx.is(model, glance.editor.model.MapIconModel)) {
                    return glance.editor.MapIcon;
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
                    "font-family": "CiscoSans"
                },
                ".glance-editor-stage text": {
                    "font-size": "1em",
                    "fill": "rgba(0,128,255,.5)"
                },
                ".glance-editor-stage .entity.shape .main": {
                    "stroke": "none",
                    "fill": "rgba(0,0,0,.1)"
                },
                ".glance-editor-stage .entity.shape.barrier .main": {
                    "fill": "rgba(0,0,0,.6)"
                },
                ".glance-editor-stage .entity .face": {
                    "fill": "transparent"
                },
                ".glance-editor-stage .entity.active-false .face": {
                    "display": "none"
                },
                ".glance-editor-stage .entity .edge": {
                    "stroke": "#00bab0"
                },
                ".glance-editor-stage .entity.active-false .edge": {
                    "display": "none"
                },
                ".glance-editor-stage .entity .vertex": {
                    "fill": "#ccc",
                    "stroke": "#00bab0"
                },
                ".glance-editor-stage .entity.active-false .vertex": {
                    "display": "none"
                }
            })
        }
    });
})(nx);
