(function(nx) {
    var EXPORT = nx.define("glance.paging.Window", nx.lib.DefaultApplication, {
        view: {
            cssclass: "app-paging",
            cssstyle: {
                transition: "1s",
                opacity: nx.binding(true, function(async) {
                    async.set(0);
                    nx.timer(1, function() {
                        async.set(1);
                    }.bind(this));
                })
            },
            content: [{
                name: "pages",
                cssclass: "glance-paging-pages"
            }, {
                name: "header",
                type: "glance.paging.Header"
            }]
        },
        methods: {
            getGlobalFontSizeByPageSize: function(size) {
                return Math.min(size.width / 20, size.height / 32);
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".app-paging > .glance-paging-pages": {
                    "nx:fixed": "0",
                    "padding-top": "5.5em",
                    "margin": "0 auto",
                    "max-width": "20em"
                }
            })
        }
    });
})(nx);
