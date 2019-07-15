(function(nx) {
    var EXPORT = nx.define("glance.perspective.DialogPersonDetail", glance.perspective.DialogPortrait, {
        view: {
            cssclass: "glance-dialog-person",
            extend: {
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
                ".glance-dialog-person > .body > .content bullet": {
                    "color": "#666",
                    "font-weight": "bold"
                }
            })
        }
    });
})(nx);
