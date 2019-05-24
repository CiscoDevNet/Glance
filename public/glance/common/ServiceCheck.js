(function (nx) {
    var EXPORT = nx.define("glance.common.ServiceCheck", glance.common.Service, {
        properties: {
            experts: {},
            expertChecked: {
                dependencies: "global.nx.util.hash.map",
                async: true,
                value: function (property, map) {
                    this.retain("expertChecked", map.cascade("checked", function (value) {
                        property.set(value);
                    }));
                }
            },
            expertSelectedId: {
                dependencies: "global.nx.util.hash.map",
                async: true,
                value: function (property, map) {
                    this.retain("expertSelectedId", map.cascade("#", function (value) {
                        property.set(value);
                    }));
                }
            },
            expertSelected: {
                dependencies: "global.app.service.experts, expertSelectedId",
                value: function (experts, selectedId) {
                    if (experts && selectedId) {
                        return experts.filter(function (expert) {
                            return nx.path(expert, "id") === selectedId;
                        })[0];
                    }
                }
            }
        },
        methods: {
            init: function () {
                this.inherited();
                var self = this;
                $.ajax({
                    url: this.getExpertListUrl(),
                    success: function (data) {
                        self.experts(nx.array.query({
                            array: data.experts,
                            mapping: function (expert) {
                                return new glance.common.Expert(expert);
                            }
                        }));
                    }
                });
                // start try notify network every 5 seconds
                setInterval(function () {
                    $.get("check.html");
                }, 10000);
            }
        }
    });
})(nx);
