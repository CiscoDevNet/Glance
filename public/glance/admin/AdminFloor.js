(function(nx) {

    var EXPORT = nx.define("glance.admin.AdminFloor", nx.ui.Element, {
        view: {
            cssclass: "glance-admin-floor",
            content: [{
                cssclass: "title",
                content: [{
                    cssclass: "main",
                    content: "FLOOR CONFIGURATION"
                }, {
                    cssclass: "operator",
                    content: [{
                        cssclass: "status active-{model.active}",
                        content: ["Status: ", nx.binding("model.active", function(active) {
                            return "<span>" + (active ? "Active" : "Deactive") + "</span>";
                        })]
                    }, {
                        cssclass: "button",
                        content: nx.binding("model.active", function(active) {
                            return active ? "Deactivate" : "Activate";
                        }),
                        capture: {
                            tap: function() {
                                // TODO
                                nx.path(this, "model.active", !nx.path(this, "model.active"));
                            }
                        }
                    }, {
                        cssclass: "button",
                        content: "Deploy",
                        capture: {
                            tap: function() {
                                // TODO
                                var floorModel = this.model();
                                var floorId = floorModel.id();
                                var editorModel = this.map().editorLoader().model();
                                glance.editor.EditorLoader.getSvgMapByEditoModel(editorModel, function(map) {
                                    window.open(map[0]);
                                }.bind(this));
                            }
                        }
                    }]
                }]
            }, {
                cssclass: "panel panel-map",
                content: [{
                    cssclass: "title",
                    content: [{
                        cssclass: "panel-name",
                        content: "FLOOR PLAN"
                    }, {
                        cssclass: "panel-operators"
                    }]
                }, {
                    name: "map",
                    type: "glance.admin.AdminFloorMap",
                    cssclass: "panel-body",
                    properties: {
                        model: "{model}"
                    }
                }]
            }, {
                cssclass: "panel panel-setting",
                content: [{
                    cssclass: "title",
                    content: [{
                        cssclass: "panel-name",
                        content: "SETTING"
                    }]
                }, {
                    type: "glance.admin.AdminFloorConfig",
                    cssclass: "panel-body",
                    properties: {
                        model: "{model}"
                    }
                }]
            }]
        },
        properties: {
            model: null
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-admin-floor": {
                    "font-size": ".7em"
                },
                ".glance-admin-floor > .title": {
                    "margin": "1em",
                    "nx:absolute": "0 0 auto 0",
                    "height": "2em",
                    "line-height": "2em",
                    "display": "flex",
                    "font-weight": "400"
                },
                ".glance-admin-floor > .title > *": {
                    "border-bottom": "3px solid white",
                    "padding-bottom": ".3em"
                },
                ".glance-admin-floor > .title > .main": {
                    "font-size": "1.1em",
                    "font-weight": "bold",
                    "width": "12em",
                    "flex-grow": "0",
                    "border-bottom": "3px solid #00bab0"
                },
                ".glance-admin-floor > .title > .operator": {
                    "position": "relative",
                    "text-align": "right",
                    "width": "12em",
                    "flex-grow": "1"
                },
                ".glance-admin-floor > .title > .operator > .status": {
                    "display": "inline-block",
                    "padding": "0 4em 0 0",
                    "width": "9em"
                },
                ".glance-admin-floor > .title > .operator > .status > span:before": {
                    "content": " ",
                    "display": "inline-block",
                    "margin": "0 .3em 0 0",
                    "nx:size": ".7em",
                    "border": "1px solid #00bab0",
                    "border-radius": "1em"
                },
                ".glance-admin-floor > .title > .operator > .status.active-true > span:before": {
                    "background": "green"
                },
                ".glance-admin-floor > .title > .operator > .status:not(.active-true) > span:before": {
                    "background": "transparent"
                },
                ".glance-admin-floor > .title > .operator > .button": {
                    "display": "inline",
                    "vertical-align": "top",
                    "padding": "0 .5em",
                    "text-align": "center",
                    "min-width": "5em",
                    "cursor": "default"
                },
                ".glance-admin-floor > .title > .operator > .button:not(:last-child)": {
                    "border-right": "1px solid #ccc"
                },
                ".glance-admin-floor > .title > .operator > .button:hover": {
                    "color": "#999"
                },
                ".glance-admin-floor > .panel-map": {
                    "nx:absolute": "4em 16em 1em 1em"
                },
                ".glance-admin-floor > .panel-setting": {
                    "nx:absolute": "4em 1em 1em auto",
                    "width": "14em"
                },
                ".glance-admin-floor > .panel > .title": {
                    "nx:absolute": "0 0 auto 0",
                    "display": "flex",
                    "justify-content": "space-between",
                    "font-size": ".8em"
                },
                ".glance-admin-floor > .panel > .title > .panel-name": {

                },
                ".glance-admin-floor > .panel > .title > .panel-name:before": {
                    "font-family": "FontAwesome",
                    "margin-right": ".2em"
                },
                ".glance-admin-floor > .panel.panel-map > .title > .panel-name:before": {
                    "content": "\\f279"
                },
                ".glance-admin-floor > .panel.panel-setting > .title > .panel-name:before": {
                    "content": "\\f013"
                },
                ".glance-admin-floor > .panel.panel-map > .title > .panel-operators > .operator > label": {
                    //
                },
                ".glance-admin-floor > .panel.panel-map > .title > .panel-operators > .operator > .file": {
                    "position": "absolute",
                    "nx:size": "1px",
                    "opacity": "0",
                    "overflow": "hidden"
                },
                ".glance-admin-floor > .panel > .panel-body": {
                    "nx:absolute": "1.5em 0 0 0",
                    "background": "#fafafa",
                    "box-shadow": "0 0 1px black"
                }
            })
        }
    });

})(nx);
