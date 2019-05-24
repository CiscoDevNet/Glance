(function(nx) {
    var rPath = /(?:\s*,\s*)?(?:([ZzMmLlHhVvCcSsQqTtAa])((?:(?:\s*,\s*)?[+-]?(?:\d*\.)?\d+(?:[eE][+-]?(?:\d*\.)?\d+)?)*))/g;
    var rDigits = /[+-]?(?:\d*\.)?\d+(?:[eE][+-]?(?:\d*\.)?\d+)?/g;
    var EXPORT = nx.define("glance.model.map.MapModel", {
        properties: {
            svg: null,
            mask: null,
            texture: null,
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            shape: null,
            terrains: {
                value: function() {
                    return new nx.List();
                }
            },
            entrances: {
                value: function() {
                    return new nx.List();
                }
            }
        }
    });
})(nx);
