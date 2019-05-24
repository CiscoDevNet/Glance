(function(nx) {

    var EXPORT = nx.define("glance.model.ServerModel", {
        properties: {
            id: null,
	    name: "",
            campuses: {
                value: function() {
                    return new nx.List();
                }
            },
            campusMap: {
                dependencies: "campuses",
                value: function(campuses) {
                    if (campuses) {
                        var map = new nx.Map();
                        map.retain(campuses.monitorContaining(function(campus) {
                            return campus.watch("id", function(pname, id) {
                                map.set(id, campus);
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
            }
        }
    });
})(nx);
