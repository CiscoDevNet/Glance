(function(nx) {
    var EXPORT = nx.define("glance.model.FloorModel", {
        properties: {
            id: null,
            index: -1,
            number: -1,
            name: "",
            map: null,
            clients: null,
            whoami: null,
            locationers: function() {
                return new nx.List();
            },
            matrix: function() {
                return nx.geometry.Matrix.I;
            },
            router: {
                dependencies: "whoami.category, map.mask, map.width, map.height",
                value: function(category, mask, width, height) {
                    if (category === "screen" && mask && width && height) {
                        return new glance.routing.Router({
                            image: mask,
                            scaleX: mask.width / width,
                            scaleY: mask.height / height
                        });
                    }
                }
            },
            persons: nx.binding("whoami.isMobile, whoami.id, clients", true, function(async, isMobile, whoami, clients) {
                if (clients) {
                    var list;
                    if (isMobile) {
                        list = nx.List.select(clients, "id, active, category", function(id, active, category) {
                            return active || category === "screen" || id === whoami;
                        });
                    } else {
                        list = nx.List.select(clients, "category", function(category) {
                            // TODO process whoami
                            return category === "expert" || category === "guest" || category === "screen";
                        });
                    }
                    async.set(list);
                    return list;
                }
            }),
            things: nx.binding("whoami.isMobile, clients", true, function(async, isMobile, clients) {
                if (clients) {
                    var list;
                    if (isMobile) {
                        list = new nx.List();
                    } else {
                        list = nx.List.select(clients, "category", function(category) {
                            // TODO process whoami
                            return category === "thing" || category === "phone";
                        });
                    }
                    async.set(list);
                    return list;
                }
            }),
            blocks: nx.binding("clients", true, function(async, clients) {
                if (clients) {
                    var list = nx.List.select(clients, "category", function(category) {
                        return category === "block";
                    });
                    async.set(list);
                    return list;
                } else {
                    async.set(null);
                    return null;
                }
            }),
            furnishes: nx.binding("clients", true, function(async, clients) {
                if (clients) {
                    var list = nx.List.select(clients, "category", function(category) {
                        return category === "furnish";
                    });
                    async.set(list);
                    return list;
                } else {
                    async.set(null);
                    return null;
                }
            }),
            zones: nx.binding("clients", true, function(async, clients) {
                if (clients) {
                    var list = nx.List.select(clients, "category", function(category) {
                        return category === "zone";
                    });
                    async.set(list);
                    return list;
                } else {
                    async.set(null);
                    return null;
                }
            }),
            facilities: nx.binding("clients", true, function(async, clients) {
                if (clients) {
                    var list = nx.List.select(clients, "category", function(category) {
                        return category === "facility";
                    });
                    async.set(list);
                    return list;
                } else {
                    async.set(null);
                    return null;
                }
            }),
            density: null
        },
        methods: {
            setClientPosition: function(client, position) {
                // TODO
                client.position(position);
            }
        }
    });
})(nx);
