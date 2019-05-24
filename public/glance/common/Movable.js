(function (nx) {
    var EXPORT = nx.define("glance.common.Movable", {
        properties: {
            id: null,
            name: null,
            avatar: null,
            position: null,
            highlighted: false
        },
        methods: {
            init: function (data) {
                this.inherited();
                nx.sets(this, data);
            }
        }
    });
})(nx);
