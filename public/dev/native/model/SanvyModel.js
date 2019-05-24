(function (nx) {
    var EXPORT = nx.define("sanvy.model.SanvyModel", {
        properties: {
            vertices: {
                value: function () {
                    return new nx.List();
                }
            }
	}
    });
})(nx);
