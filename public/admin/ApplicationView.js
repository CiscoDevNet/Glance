(function(nx) {
    var GeoMath = nx.geometry.Math;
    var EXPORT = nx.define("devme.admin.ApplicationView", nx.ui.Element, {
        view: {
            cssclass: "app",
            content: [{
                name: "header",
                type: "glance.paging.Header",
                properties: {
                    text: "Administrative"
                }
            }, {
                name: "pages",
                cssclass: "glance-check-body",
                content: [{
                    type: "devme.admin.ApplicationFrontPage",
                    events: {
                        select: "onSelect"
                    }
                }, {
                    type: "devme.admin.Setup",
                    events: {
                        close: "onCancel"
                    }
                }, {
                    type: "devme.admin.ExpertRegister",
                    events: {
                        close: "onCancel"
                    }
                }, {
                    type: "devme.admin.MapRegister",
                    events: {
                        close: "onCancel"
                    }
                }, {
                    type: "devme.admin.Backup",
                    events: {
                        close: "onCancel"
                    }
                }]
            }]
        },
        methods: {
            onSelect: function(sender, name) {
                this.header().withLoadingTransition(function(complete) {
                    var map = nx.util.hash.getHashMap();
                    map["#"] = name;
                    nx.util.hash.setHashMap(map);
                    complete();
                });
            },
            onCancel: function(sender) {
                this.header().withLoadingTransition(function(complete) {
                    sender.reset && sender.reset();
                    var map = nx.util.hash.getHashMap();
                    map["#"] = null;
                    nx.util.hash.setHashMap(map);
                    complete();
                });
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".app > .glance-paging-header": {
                    "position": "fixed",
                    "left": "0",
                    "top": "0",
                    "width": "100%",
                    "z-index": "10"
                },
                ".app > .glance-check-body": {
                    "padding": "5.5em 1em 1em",
                    "margin": "0 auto",
                    "max-width": "20em",
                    "z-index": "0"
                }
            })
        }
    });
})(nx);
