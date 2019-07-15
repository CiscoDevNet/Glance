(function(nx) {
    var EXPORT = nx.define("glance.model.ClientModel", {
        properties: {
            category: "expert",
            id: null,
            avatarVersion: "",
            name: "",
            title: "",
            topics: null,
            online: false,
            buildingId: null,
            floorId: null,
            imagePath: null,
            position: [0, 0],
            color: null,
            showLabel: true,
            attendees: function() {
                return new nx.List();
            },
            isme: false,
            isroute: false,
            isMobile: nx.binding("category", function(category) {
                return category === "visitor" || category === "expert" || category === "guest";
            }),
            active: nx.binding("isme, attendees.length", function(isme, length) {
                return isme || length;
            }),
            shape: null,
            group: "",
            count: 0
        },
        methods: {
            init: function(options) {
                this.inherited();
                nx.sets(this, options);
            }
        }
    });
})(nx);
