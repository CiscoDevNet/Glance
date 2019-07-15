(function (nx) {
    var EXPORT = nx.define("nx.topology.view.shape.DefaultNodeShape", nx.lib.svg.shape.Node, {
        view: {
            cssstyle: {
                width: "{icon.width}",
                height: "{icon.height}"
            },
            content: [{
                type: "nx.lib.svg.shape.Text",
                content: "{icon.text.0}"
            }, {
                type: "nx.lib.svg.shape.Text",
                content: "{icon.text.1}"
            }]
        },
        properties: {
            icon: {
                dependencies: "model.type",
                value: function (type) {
                    return EXPORT.ICONS[type] || EXPORT.ICONS.unknown;
                }
            },
            topology: null,
            model: null
        },
        statics: {
            ICONS: {
                unknown: {
                    width: 32,
                    height: 32,
                    text: ["\ue612", "\ue611"]
                },
                switch: {
                    width: 32,
                    height: 32,
                    text: ["\ue618", "\ue619"]
                },
                router: {
                    width: 32,
                    height: 32,
                    text: ["\ue61c", "\ue61d"]
                },
                wlc: {
                    width: 32,
                    height: 32,
                    text: ["\ue60f", "\ue610"]
                },
                server: {
                    width: 32,
                    height: 32,
                    text: ["\ue61b", "\ue61a"]
                },
                phone: {
                    width: 32,
                    height: 32,
                    text: ["\ue61e", "\ue61f"]
                },
                nexus5000: {
                    width: 32,
                    height: 32,
                    text: ["\ue620", "\ue621"]
                },
                ipphone: {
                    width: 32,
                    height: 32,
                    text: ["\ue622", "\ue623"]
                },
                host: {
                    width: 32,
                    height: 32,
                    text: ["\ue624", "\ue625"]
                },
                camera: {
                    width: 32,
                    height: 32,
                    text: ["\ue626", "\ue627"]
                },
                accesspoint: {
                    width: 32,
                    height: 32,
                    text: ["\ue628", "\ue629"]
                },
                groups: {
                    width: 32,
                    height: 32,
                    text: ["\ue615", "\ue62f"]
                },
                groupm: {
                    width: 32,
                    height: 32,
                    text: ["\ue616", "\ue630"]
                },
                groupl: {
                    width: 32,
                    height: 32,
                    text: ["\ue617", "\ue631"]
                },
                collapse: {
                    width: 16,
                    height: 16,
                    text: ["\ue62e", "\ue61d"]
                },
                expand: {
                    width: 14,
                    height: 14,
                    text: ["\ue62d", "\ue61d"]
                },
                cloud: {
                    width: 48,
                    height: 48,
                    text: ["\ue633", "\ue633"]
                },
                unlinked: {
                    width: 32,
                    height: 32,
                    text: ["\ue646", "\ue61d"]
                },
                firewall: {
                    width: 32,
                    height: 32,
                    text: ["\ue647", "\ue648"]
                },
                hostgroup: {
                    width: 32,
                    height: 32,
                    text: ["\ue64d", "\ue64c"]
                },
                wirelesshost: {
                    width: 32,
                    height: 32,
                    text: ["\ue64e", "\ue64c"]
                }
            }
        }
    });
})(nx);
