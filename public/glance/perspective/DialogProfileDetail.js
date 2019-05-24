(function(nx) {
    var EXPORT = nx.define("glance.perspective.DialogProfileDetail", glance.perspective.DialogProfile, {
        view: {
            cssclass: "glance-dialog-person",
            extend: {
                header: {
                    content: [{
                        cssclass: "header-button",
                        capture: {
                            tap: function() {
                                this.fire("backward", this.model());
                            }
                        }
                    }, {
                        cssclass: "header-title",
                        content: "Device Owner Profile"
                    }]
                },
                title: {
                    content: "{model.name}"
                },
                portrait: {
                    properties: {
                        src: nx.binding("model.id, model.avatarVersion", function(id, avatarVersion) {
                            return glance.service.api.getLargeAvatarUrl({
                                id: id
                            }) + "?x=" + avatarVersion;

                        })
                    }
                },
                subtitle: {
                    content: "{model.title}"
                },
                content: {
                    cssstyle: {
                        display: nx.binding("model.topics.length", nx.util.cssstyle.toCssDisplayVisible)
                    },
                    content: ["<bullet>EXPERTISE</bullet><br/>", {
                        repeat: "{model.topics}",
                        content: ["<bullet>•</bullet> ", "{scope.model}"]
                    }]
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-dialog-person > .body > .header > .header-button": {
                    "text-align": "center",
                    "box-sizing": "border-box",
                    "width": "3em",
                    "height": "3em",
                    "float": "left",
                    "background": "#f7f7f7",
                    "border-right": "1px solid #e7e7e7"
                },
                ".glance-dialog-person > .body > .header > .header-button:after": {
                    "content": "\\f060",
                    "font-family": "FontAwesome",
                    "font-size": "1em",
                    "width": "100%",
                    "height": "3em",
                    "text-align": "center",
                    "line-height": "3em"

                },
                ".glance-dialog-person > .body > .header > .header-title": {
                    "width": "22em",
                    "box-sizing": "border-box",
                    "font-size": "1em",
                    "background": "#f7f7f7",
                    "padding-left": "1em",
                    "float": "left",
                    "height": "3em",
                    "line-height": "3em"
                },
                ".glance-dialog-person > .body > .content bullet": {
                    "color": "#333",
                    "font-weight": "normal"
                },
                ".glance-dialog-person > .body > .content > nx-element:first-child": {
                    "border-top": "1px dotted #ccc"
                }

            })
        }
    });
})(nx);
