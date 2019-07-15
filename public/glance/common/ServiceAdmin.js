(function (nx) {
    var EXPORT = nx.define("glance.common.ServiceAdmin", glance.common.Service, {
        properties: {
            page: {
                dependencies: "global.nx.util.hash.map",
                async: true,
                value: function (property, map) {
                    this.retain("hash", map.cascade("#", function (value) {
                        property.set(value);
                    }));
                }
            }
        }
    });
})(nx);
