(function(nx) {

    var EXPORT = nx.define("glance.model.CampusModel", {
        properties: {
            id: null,
            name: "",
            // buildings
            buildings: {
                value: function() {
                    return new nx.List();
                }
            },
            buildingMap: {
                dependencies: "buildings",
                value: function(buildings) {
                    if (buildings) {
                        var map = new nx.Map();
                        map.retain(buildings.monitorContaining(function(building) {
                            return building.watch("id", function(pname, id) {
                                map.set(id, building);
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
