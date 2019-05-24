(function(nx) {

    var EXPORT = nx.define("glance.admin.Window", nx.lib.DefaultApplication, {
        view: {
            cssclass: "glance admin",
            content: {
                name: "admin",
                type: "glance.admin.Admin",
                properties: {
                    model: "{adminModel}"
                }
            }
        },
        properties: {
            adminModel: function() {
                return new glance.model.AdminModel();
            },
            service: nx.binding("adminModel", function(adminModel) {
                if (adminModel) {
                    var service = new glance.service.Service("admin");
                    service.retain(service.on("message", function(sender, data) {
                        var model;
                        if (data.servers) {
                            this.makeupTreeModel(adminModel, adminModel.servers(), data.servers, [
                                "admin", glance.model.ServerModel, "id=serverId, name", "campuses", [
                                    "server", glance.model.CampusModel, "id=campusId, name", "buildings", [
                                        "campus", glance.model.BuildingModel, "id=buildingId, name", "floors", [
                                            "building", glance.model.FloorModel, "id=floorId, name, mapUrl=map.url", "locationers", [
                                                "floor", glance.model.LocationerModel, "*"
                                            ]
                                        ]
                                    ]
                                ]
                            ]);
                        }
                        if (data.devlists) {
                            adminModel.devlists().pushAll(data.devlists.map(function(devlist) {
                                var list, item;
                                item = new glance.model.DevlistModel();
                                item.admin(adminModel);
                                item.name(devlist.name);
                                nx.each(devlist.devices, function(device) {
                                    var dev = new nx.Object();
                                    nx.each(device, function(value, key) {
                                        nx.Object.extendProperty(dev, key, {
                                            value: value
                                        }, true);
                                    });
                                    item.devices().push(dev);
                                });
                                return item;
                            }));
                        }
                    }.bind(this)));
                    return service;
                }
            })
        },
        methods: {
            init: function() {
                this.inherited();
                // check if demo
                var service = this.service();
                if (!nx.path(nx.global, "nx.util.url.search.DEMO")) {
                    service.autoconnect(true);
                } else {
                    glance.admin.DEMO.run(this, service);
                }
            },
            getGlobalFontSizeByPageSize: function(size) {
                return Math.min(size.width / 1440, size.height / 1440) * 30;
            },
            makeupTreeModel: function(parent, list, items, [key, type, mappers, childrenkey, childmeta], trace) {
                if (mappers !== "*") {
                    mappers = mappers.split(",").map(function(v) {
                        v = nx.string.trim(v).split("=").map(nx.string.trim);
                        return [v[0], v[1] || v[0]];
                    });
                }
                // makeup items and add into list
                nx.each(items, function(item) {
                    var sublist, model = new type();
                    // update parent key
                    nx.path(model, key, parent);
                    // update ancient keys
                    nx.each(trace, function(key) {
                        nx.path(model, key, nx.path(parent, key));
                    });
                    // update mappers
                    if (mappers === "*") {
                        nx.each(item, function(value, key) {
                            nx.path(model, key, value);
                        });
                    } else {
                        nx.each(mappers, function(mapper) {
                            nx.path(model, mapper[0], nx.path(item, mapper[1]));
                        });
                    }
                    // update children
                    if (childrenkey && childmeta) {
                        var sublist = nx.path(model, childrenkey) || nx.path(model, childrenkey, new nx.List());
                        this.makeupTreeModel(model, sublist, item[childrenkey], childmeta, [key].concat(trace || []));
                    }
                    // append to list
                    list.push(model);
                }.bind(this));
                return list;
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance.admin": {
                    "nx:fixed": "0",
                    "font-family": "CiscoSans",
                    "font-weight": "200",
                    "background-size": "100% 100%"
                }
            })
        }
    });

})(nx);
