(function(nx) {

    var EXPORT = nx.define("glance.admin.AdminFloorMap", nx.ui.Element, {
        view: {
            cssclass: "glance-admin-floor-map editor-mode-{editorLoader.model.mode}",
            content: [{
                cssclass: "editor",
                content: "{editorLoader.view}"
            }, {
                cssclass: "materials",
                content: [{
                    cssclass: "tools",
                    content: [{
                        cssclass: "button upload",
                        content: [{
                            type: "nx.ui.tag.Label",
                            attributes: {
                                "for": "{mapUploadId}"
                            }
                        }, {
                            cssclass: "file",
                            content: {
                                type: "nx.ui.tag.InputFile",
                                attributes: {
                                    id: "{mapUploadId}",
                                    name: "{mapUploadId}"
                                },
                                events: {
                                    change: function(sender, evt) {
                                        // FIXME resource leak
                                        var map = this;
                                        var input = evt.target;
                                        var reader = new FileReader();
                                        try {
                                            var file = input.files[0];
                                            // TODO pre-check the file
                                            reader.addEventListener("loadend", function(e) {
                                                var preview = document.createElement("img");
                                                preview.onload = function() {
                                                    var [width, height] = [preview.width, preview.height];
                                                    map.setBackground(width, height, reader.result);
                                                };
                                                preview.src = reader.result;
                                            });
                                            reader.readAsDataURL(file);
                                        } finally {
                                            evt.preventDefault();
                                        }
                                    }
                                }
                            }
                        }]
                    }, {
                        cssclass: "button idle",
                        capture: {
                            tap: function(sender) {
                                this.onGroupAddTap(sender, "idle");
                            }
                        }
                    }, {
                        cssclass: "button boundary",
                        capture: {
                            tap: function(sender) {
                                this.onGroupAddTap(sender, "idle");
                                this.editorLoader().model().active(this.editorLoader().model().boundary());
                            }
                        }
                    }]
                }, {
                    cssclass: "group zones",
                    content: [{
                        cssclass: "title",
                        content: ["Zones", {
                            cssclass: "button button-add",
                            capture: {
                                tap: function(sender) {
                                    this.onGroupAddTap(sender, "regions");
                                }
                            }
                        }],
                        capture: {
                            tap: "{onGroupTitleTap}"
                        }
                    }, {
                        repeat: "{editorLoader.model.regions}",
                        cssclass: "item active-{scope.model.active}",
                        content: ["{scope.model.name}", nx.binding("scope.model.name", function(name) {
                            if (!name) {
                                return "<placeholder>&lt;zone&gt;</placeholder>";
                            }
                        }), {
                            cssclass: "button button-edit",
                            capture: {
                                tap: function(sender) {
                                    var old = nx.path(this, "scope.model.name");
                                    glance.common.DialogUtil.prompt("Input a new name:", old, function(text) {
                                        if (text !== old) {
                                            nx.path(this, "scope.model.name", text);
                                            // TODO call API to rename
                                        }
                                    }.bind(this));
                                }
                            }
                        }, {
                            cssclass: "button button-remove",
                            capture: {
                                tap: function(sender) {
                                    glance.common.DialogUtil.confirm("Are you sure to remove?", function(result) {
                                        if (result) {
                                            var list = nx.path(this, "scope.list");
                                            var model = nx.path(this, "scope.model");
                                            list.remove(model);
                                            // TODO call API to remove
                                        }
                                    }.bind(this));
                                }
                            }
                        }],
                        capture: {
                            tap: function() {
                                var model = nx.path(this, "scope.model");
                                var editorModel = nx.path(this, "scope.context.editorLoader.model");
                                editorModel.active(model);
                            }
                        }
                    }]
                }, {
                    cssclass: "group walls",
                    content: [{
                        cssclass: "title",
                        content: ["Walls", {
                            cssclass: "button button-add",
                            capture: {
                                tap: function(sender) {
                                    this.onGroupAddTap(sender, "walls");
                                }
                            }
                        }],
                        capture: {
                            tap: "{onGroupTitleTap}"
                        }
                    }, {
                        repeat: "{editorLoader.model.walls}",
                        cssclass: "item active-{scope.model.active}",
                        content: ["{scope.model.name}", nx.binding("scope.model.name", function(name) {
                            if (!name) {
                                return "<placeholder>&lt;wall&gt;</placeholder>";
                            }
                        }), {
                            cssclass: "button button-edit",
                            capture: {
                                tap: function(sender) {
                                    var old = nx.path(this, "scope.model.name");
                                    glance.common.DialogUtil.prompt("Input a new name:", old, function(text) {
                                        if (text !== old) {
                                            nx.path(this, "scope.model.name", text);
                                            // TODO call API to rename
                                        }
                                    }.bind(this));
                                }
                            }
                        }, {
                            cssclass: "button button-remove",
                            capture: {
                                tap: function(sender) {
                                    glance.common.DialogUtil.confirm("Are you sure to remove?", function(result) {
                                        if (result) {
                                            var list = nx.path(this, "scope.list");
                                            var model = nx.path(this, "scope.model");
                                            list.remove(model);
                                            // TODO call API to remove
                                        }
                                    }.bind(this));
                                }
                            }
                        }],
                        capture: {
                            tap: function() {
                                var model = nx.path(this, "scope.model");
                                var editorModel = nx.path(this, "scope.context.editorLoader.model");
                                editorModel.active(model);
                            }
                        }
                    }]
                }, {
                    cssclass: "group blocks",
                    content: [{
                        cssclass: "title",
                        content: ["Blocks", {
                            cssclass: "button button-add",
                            capture: {
                                tap: function(sender) {
                                    this.onGroupAddTap(sender, "barriers");
                                }
                            }
                        }],
                        capture: {
                            tap: "{onGroupTitleTap}"
                        }
                    }, {
                        repeat: "{editorLoader.model.barriers}",
                        cssclass: "item active-{scope.model.active}",
                        content: ["{scope.model.name}", nx.binding("scope.model.name", function(name) {
                            if (!name) {
                                return "<placeholder>&lt;block&gt;</placeholder>";
                            }
                        }), {
                            cssclass: "button button-edit",
                            capture: {
                                tap: function(sender) {
                                    var old = nx.path(this, "scope.model.name");
                                    glance.common.DialogUtil.prompt("Input a new name:", old, function(text) {
                                        if (text !== old) {
                                            nx.path(this, "scope.model.name", text);
                                            // TODO call API to rename
                                        }
                                    }.bind(this));
                                }
                            }
                        }, {
                            cssclass: "button button-remove",
                            capture: {
                                tap: function(sender) {
                                    glance.common.DialogUtil.confirm("Are you sure to remove?", function(result) {
                                        if (result) {
                                            var list = nx.path(this, "scope.list");
                                            var model = nx.path(this, "scope.model");
                                            list.remove(model);
                                            // TODO call API to remove
                                        }
                                    }.bind(this));
                                }
                            }
                        }],
                        capture: {
                            tap: function() {
                                var model = nx.path(this, "scope.model");
                                var editorModel = nx.path(this, "scope.context.editorLoader.model");
                                editorModel.active(model);
                            }
                        }
                    }]
                }, {
                    cssclass: "group facilities",
                    content: [{
                        cssclass: "title",
                        content: ["Facilities", , {
                            cssclass: "button button-add",
                            capture: {
                                tap: function(sender) {
                                    this.onGroupAddTap(sender, "facilities");
                                }
                            }
                        }],
                        capture: {
                            tap: "{onGroupTitleTap}"
                        }
                    }, {
                        repeat: "{editorLoader.model.facilities}",
                        cssclass: "item active-{scope.model.active}",
                        content: ["{scope.model.name}", nx.binding("scope.model.name", function(name) {
                            if (!name) {
                                return "<placeholder>&lt;facility&gt;</placeholder>";
                            }
                        }), {
                            cssclass: "button button-edit",
                            capture: {
                                tap: function(sender) {
                                    var old = nx.path(this, "scope.model.name");
                                    glance.common.DialogUtil.prompt("Input a new name:", old, function(text) {
                                        if (text !== old) {
                                            nx.path(this, "scope.model.name", text);
                                            // TODO call API to rename
                                        }
                                    }.bind(this));
                                }
                            }
                        }, {
                            cssclass: "button button-remove",
                            capture: {
                                tap: function(sender) {
                                    glance.common.DialogUtil.confirm("Are you sure to remove?", function(result) {
                                        if (result) {
                                            var list = nx.path(this, "scope.list");
                                            var model = nx.path(this, "scope.model");
                                            list.remove(model);
                                            // TODO call API to remove
                                        }
                                    }.bind(this));
                                }
                            }
                        }],
                        capture: {
                            tap: function() {
                                var model = nx.path(this, "scope.model");
                                var editorModel = nx.path(this, "scope.context.editorLoader.model");
                                editorModel.active(model);
                            }
                        }
                    }]
                }]
            }]
        },
        properties: {
            model: null,
            mapUploadId: function() {
                return "file-" + nx.serial();
            },
            editorLoader: nx.binding("model.mapUrl", true, function(async, mapUrl) {
                var loader = async.get() || async.set(new glance.editor.EditorLoader());
                if (mapUrl) {
                    loader.load(mapUrl);
                } else {
                    var emodel = new glance.editor.model.EditorModel();
                    var boundary = new glance.editor.model.MapRegionModel();
                    boundary.segments().pushAll(glance.editor.model.SvgPathModel.getSegmentsByDefArray([
                        ["M", [0, 0]],
                        ["L", [1024, 0]],
                        ["L", [1024, 768]],
                        ["L", [0, 768]],
                        ["Z"],
                    ]));
                    emodel.boundary(boundary);
                    emodel.width(1024);
                    emodel.height(768);
                    loader.model(emodel);
                }
            })
        },
        methods: {
            setBackground: function(width, height, url) {
                var model = this.editorLoader().model();
                model.width(width);
                model.height(height);
                model.backgroundUrl(url);
            },
            onGroupTitleTap: function(sender) {
                sender.parent().toggleClass("collapsed-true");
            },
            onGroupAddTap: function(sender, mode) {
                var editorModel = nx.path(this, "editorLoader.model");
                if (mode !== editorModel.mode()) {
                    editorModel.temporary(null);
                    editorModel.active(null);
                    editorModel.mode(mode);
                } else {
                    editorModel.temporary(null);
                    editorModel.active(null);
                    editorModel.mode("idle");
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-admin-floor-map": {
                    "nx:absolute": "0"
                },
                ".glance-admin-floor-map:not(.editor-mode-idle)": {
                    "cursor": "crosshair"
                },
                ".glance-admin-floor-map > .editor": {
                    "nx:absolute": "0 14em 0 0",
                    "background": "#fff"
                },
                ".glance-admin-floor-map > .materials": {
                    "nx:absolute": "0 0 0 auto",
                    "width": "14em",
                    "overflow-y": "auto"
                },
                ".glance-admin-floor-map > .materials > .tools": {
                    "display": "flex"
                },
                ".glance-admin-floor-map > .materials > .tools > .button": {
                    "position": "relative",
                    "width": "2em",
                    "height": "2em",
                    "line-height": "2em",
                    "text-align": "center",
                    "flex-grow": "1"
                },
                ".glance-admin-floor-map > .materials > .tools > .button:hover": {
                    "background": "rgba(0,0,0,.2)"
                },
                ".glance-admin-floor-map > .materials > .tools > .button:active": {
                    "background": "rgba(0,0,0,.1)"
                },
                ".glance-admin-floor-map > .materials > .tools > .button > label": {
                    "nx:absolute": "0"
                },
                ".glance-admin-floor-map > .materials > .tools > .button > label:before": {
                    "font-family": "FontAwesome",
                    "content": "\\f093"
                },
                ".glance-admin-floor-map > .materials > .tools > .button.idle": {
                    "border-left": "1px solid #ccc"
                },
                ".glance-admin-floor-map > .materials > .tools > .button.idle:before": {
                    "font-family": "FontAwesome",
                    "content": "\\f245"
                },
                ".glance-admin-floor-map > .materials > .tools > .button.boundary": {
                    "border-left": "1px solid #ccc"
                },
                ".glance-admin-floor-map > .materials > .tools > .button.boundary:before": {
                    "content": " ",
                    "nx:size": "1em",
                    "display": "inline-block",
                    "vertical-align": "middle",
                    "background": "url('data:image/svg+xml;utf8," + glance.common.Icon.SHAPES.boundary + "')"
                },
                ".glance-admin-floor-map > .materials > .tools > .button > .file": {
                    "position": "absolute",
                    "nx:size": "1px",
                    "opacity": "0",
                    "overflow": "hidden"
                },
                ".glance-admin-floor-map > .materials > .group": {
                    "padding": ".5em 0",
                    "border-top": "2px solid #00bab0"
                },
                ".glance-admin-floor-map > .materials > .group + .group": {
                    "border-top": "1px solid #ccc"
                },
                ".glance-admin-floor-map > .materials > .group > .title": {
                    "position": "relative",
                    "font-weight": "400",
                    "cursor": "default",
                    "padding": "0 1em"
                },
                ".glance-admin-floor-map > .materials > .group > .title:before": {
                    "content": " ",
                    "display": "inline-block",
                    "vertical-align": "middle",
                    "nx:size": "1em",
                    "margin": "0 .3em 0 0",
                    "background": "url('data:image/svg+xml;utf8," + glance.common.Icon.SHAPES.icon_down + "')",
                    "transition": ".2s"
                },
                ".glance-admin-floor-map > .materials > .group.collapsed-true > .title:before": {
                    "transform": "rotate(-90deg)"
                },
                ".glance-admin-floor-map > .materials > .group > .title > .button": {
                    "nx:absolute": "0 1em 0 auto",
                    "nx:size": "1em auto"
                },
                ".glance-admin-floor-map > .materials > .group > .title > .button-add:before": {
                    "content": "\\f196",
                    "font-family": "FontAwesome"
                },
                ".glance-admin-floor-map > .materials > .group > .item": {
                    "padding": ".3em 1em",
                    "cursor": "default"
                },
                ".glance-admin-floor-map > .materials > .group.collapsed-true > .item": {
                    "display": "none"
                },
                ".glance-admin-floor-map > .materials > .group > .item:hover": {
                    "background": "#eeeeee"
                },
                ".glance-admin-floor-map > .materials > .group > .item.active-true": {
                    "background": "#bef1ee"
                },
                ".glance-admin-floor-map > .materials > .group > .item:before": {
                    "content": " ",
                    "display": "inline-block",
                    "nx:size": ".5em",
                    "vertical-align": "middle",
                    "margin-right": ".2em",
                    "border-radius": "50%",
                    "border-color": "#8ed72b",
                    "border-style": "solid",
                    "border-width": "1px"
                },
                ".glance-admin-floor-map > .materials > .group > .item > placeholder": {
                    "display": "inline",
                    "opacity": ".5"
                },
                ".glance-admin-floor-map > .materials > .group > .item > .button": {
                    "display": "none"
                },
                ".glance-admin-floor-map > .materials > .group > .item:hover > .button": {
                    "display": "inline-block",
                    "margin-left": ".2em",
                    "color": "#777",
                    "line-height": ".5em"
                },
                ".glance-admin-floor-map > .materials > .group > .item > .button:hover": {
                    "color": "#333"
                },
                ".glance-admin-floor-map > .materials > .group > .item > .button:after": {
                    "font-family": "FontAwesome",
                    "display": "inline",
                    "font-size": ".7em"
                },
                ".glance-admin-floor-map > .materials > .group > .item > .button-edit:after": {
                    "content": "\\f044"
                },
                ".glance-admin-floor-map > .materials > .group > .item > .button-remove:after": {
                    "content": "\\f1f8"
                }
            })
        }
    });

})(nx);
