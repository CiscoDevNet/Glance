(function(nx) {
    var EXPORT = nx.define("glance.model.DevlistModel", {
        properties: {
            admin: null,
            name: "",
            devices: function() {
                return new nx.List();
            }
	}
    });
})(nx);
