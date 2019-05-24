(function(nx) {
    var EXPORT = nx.define("glance.model.AdminModel", {
        properties: {
            devlists: {
                value: function() {
                    return new nx.List();
                }
            },
            servers: {
                value: function() {
                    return new nx.List();
                }
            },
            serverMap: {
                dependencies: "servers",
                value: function(servers) {
                    if (servers) {
                        var map = new nx.Map();
                        map.retain(servers.monitorContaining(function(server) {
                            return server.watch("id", function(pname, id) {
                                map.set(id, server);
                                return {
                                    release: function() {
                                        map.remove(id);
                                    }
                                };
                            })
                        }));
                        return map;
                    }
                }
            },
            tab: null,
            tabs: function() {
                return new nx.List();
            }
        }
    });
})(nx);
