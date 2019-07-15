(function(nx) {
    var EXPORT = nx.define("glance.editor.model.VertexModel", {
        properties: {
            id: null,
            x: 0,
            y: 0
        },
        methods: {
            init: function(x, y) {
                this.inherited();
                this.x(x);
                this.y(y);
            }
        }
    });
})(nx);
