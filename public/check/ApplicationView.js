(function (nx) {
    var GeoMath = nx.geometry.Math;
    var EXPORT = nx.define("devme.check.ApplicationView", nx.ui.Element, {
        view: {
            cssclass: "app",
            content: [{
                name: "header",
                type: "glance.common.Header",
                properties: {
                    text: "Expert Check-in"
                }
            }, {
                name: "pages",
                cssclass: "glance-check-body",
                content: [{
                    name: "pageSearch",
                    type: "devme.check.PageSearch",
                    events: {
                        select: "onSelect"
                    }
                }, {
                    name: "pageCheckin",
                    type: "devme.check.PageCheckin",
                    events: {
                        checkin: "onCheckin",
                        cancel: "onCancel"
                    }
                }, {
                    name: "pageCheckout",
                    type: "devme.check.PageCheckout",
                    events: {
                        checkout: "onCheckout"
                    }
                }]
            }]
        },
        methods: {
            onSelect: function (sender, expert) {
                this.header().withLoadingTransition(function (complete) {
                    var map = nx.util.hash.getHashMap();
                    map["#"] = nx.path(expert, "id");
                    nx.util.hash.setHashMap(map);
                    complete();
                });
            },
            onCheckin: function (sender) {
                // TODO on fail
                $.ajax({
                    method: "POST",
                    url: global.app.service().getCheckUrl(global.app.service().expertSelected()),
                    success: function () {
                        this.header().withLoadingTransition(function (complete) {
                            var map = nx.util.hash.getHashMap();
                            map.checked = "true";
                            nx.util.hash.setHashMap(map);
                            complete();
                        });
                    }.bind(this)
                });
            },
            onCancel: function (sender) {
                this.header().withLoadingTransition(function (complete) {
                    var map = nx.util.hash.getHashMap();
                    map["#"] = null;
                    nx.util.hash.setHashMap(map);
                    complete();
                });
            },
            onCheckout: function (sender) {
                // TODO on fail
                $.ajax({
                    method: "DELETE",
                    url: global.app.service().getCheckUrl(global.app.service().expertSelected()),
                    success: function () {
                        this.header().withLoadingTransition(function (complete) {
                            var map = nx.util.hash.getHashMap();
                            delete map.checked;
                            map["#"] = null;
                            nx.util.hash.setHashMap(map);
                            complete();
                        });
                    }.bind(this)
                });
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".app > .glance-header": {
                    "position": "fixed",
                    "left": "0",
                    "top": "0",
                    "width": "100%",
                    "z-index": "10"
                },
                ".app > .glance-check-body": {
                    "padding-top": "5.5em",
		    "margin": "0 auto",
		    "max-width": "20em",
                    "z-index": "0"
                }
            })
        }
    });
})(nx);
