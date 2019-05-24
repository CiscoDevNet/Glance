(function(nx) {

    var EXPORT = nx.define("glance.model.CloudModel", {
        properties: {
            servers: {
                value: function() {
                    return new nx.List();
                }
            }
        }
    });
})(nx);
