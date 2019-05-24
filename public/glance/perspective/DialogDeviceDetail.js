(function(nx) {
    var EXPORT = nx.define("glance.perspective.DialogDeviceDetail", glance.perspective.DialogDevice, {
        view: {
            cssclass: "glance-dialog-person",
            extend: {
                header: {
                    content:"Device"
                },
                // deviceIcon: {

                // },
                deviceName: {
                    content: "&nbsp;"
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
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
            })
        }
    });
})(nx);
