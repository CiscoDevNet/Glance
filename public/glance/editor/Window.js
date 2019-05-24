(function(nx) {
    var EXPORT = nx.define("glance.editor.Window", nx.lib.DefaultApplication, {
        view: {
            cssclass: "glance-editor-window",
            content: [{
                name: "header",
                type: "glance.editor.WindowHeader",
                cssclass: "header",
                properties: {
                    title: "{model.name}"
                },
                events: {
                    close: function() {
                        var model = nx.path(this, "loader.view.model");
                        var svg = glance.editor.model.EditorModel.getSvgByModel(model);
                        var mask = glance.editor.model.EditorModel.getMaskBySvg(svg.dom());
                        nx.timer(0, function() {
                            window.open(mask, "mask");
                        });
                        nx.timer(0, function() {
                            window.open(svg.serialize(), "map");
                        });
                        this.fire("close", model);
                    }
                }
            }, {
                cssclass: "body",
                content: "{loader.view}"
            }]
        },
        properties: {
            name: "standard",
            loader: nx.binding("name", true, function(async, name) {
                var loader = async.get() || async.set(new glance.editor.EditorLoader());
                loader.mapUrl("map/" + name + ".svg");
            })
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-editor-window": {
                    "position": "fixed",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "bottom": "0px",
                    "font-size": "1.5em"
                },
                ".glance-editor-window > .body": {
                    "position": "absolute",
                    "left": "0px",
                    "right": "0px",
                    "top": "2em",
                    "bottom": "0px"
                }
            })
        }
    });
})(nx);
