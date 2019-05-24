(function(nx) {

    var EXPORT = nx.define("glance.admin.Admin", nx.ui.Element, {
        view: {
            cssclass: "glance-admin",
            content: [{
                name: "profile",
                type: "glance.admin.Header"
            }, {
                name: "navigator",
                type: "glance.admin.Navigator",
                properties: {
                    model: "{model}"
                }
            }, {
                repeat: "{model.tabs}",
                cssclass: "admin-tab focused-{focused}",
                properties: {
                    focused: nx.binding("scope.model, scope.context.model.tab", function(model, tab) {
                        return model === tab;
                    })
                },
                content: nx.binding("scope.model", function(model) {
                    return {
                        type: this.scope().context().getTabTypeByModel(model),
                        properties: {
                            model: model
                        }
                    };
                })
            }]
        },
        properties: {
            model: null
        },
        methods: {
            getTabTypeByModel: function(model) {
                if (nx.is(model, glance.model.FloorModel)) {
                    return glance.admin.AdminFloor;
                }
                return glance.admin.AdminDevlist;
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-admin": {
                    "nx:absolute": "0"
                },
                ".glance-admin-header": {
                    "nx:absolute": "0 auto auto 0",
                    "nx:size": "10em 6em",
                    "background": "#405168"
                },
                ".glance-admin-navigator": {
                    "nx:absolute": "6em auto 0 0",
                    "width": "10em",
                    "background": "#405168"
                },
                ".glance-admin > .admin-tab": {
                    "nx:absolute": "0 0 0 10em",
                    "background": "#e4eaf1",
                    "color": "#333"
                },
                ".glance-admin > .admin-tab:not(.focused-true)": {
                    "display": "none"
                }
            })
        }
    });

})(nx);
