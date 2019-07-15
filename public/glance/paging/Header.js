(function(nx) {
    var GeoMath = nx.geometry.Math;
    var EXPORT = nx.define("glance.paging.Header", nx.ui.Element, {
        view: {
            cssclass: ["glance-paging-header", nx.binding("loading", function(loading) {
                return loading && "loading";
            })],
            content: {
                content: [{
                    type: "glance.common.BrandGlance"
                }, {
                    content: nx.binding("text")
                }]
            }
        },
        properties: {
            loading: false,
            text: ""
        },
        methods: {
            withLoadingTransition: function(callback) {
                var self = this;
                var listener;
                var async = function() {
                    callback(function() {
                        self.loading(false);
                    });
                    listener.release();
                    listener = null;
                };
                listener = this.on("transitionend", async);
                // FIXME quirk for some bad navigator
                setTimeout(function() {
                    if (listener) {
                        async();
                    }
                }, 1000);
                this.loading(true);
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-paging-header": {
                    "nx:absolute": "0 0 auto 0",
                    "margin": "0 0 auto 0",
                    "font-size": "1.8em",
                    "background": "#0a233f",
                    "text-align": "center",
                    "height": "3.2em",
                    "transition": ".3s"
                },
                ".glance-paging-header.loading": {
                    "height": "100%"
                },
                ".glance-paging-header > nx-element": {
                    "position": "absolute",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "bottom": "0px",
                    "margin": "auto",
                    "width": "auto",
                    "height": "3.2em"
                },
                ".glance-paging-header > nx-element > img:first-child": {
                    "margin": "0.8em auto 0.2em",
                    "height": "1em"
                },
                ".glance-paging-header > nx-element > nx-element:last-child": {
                    "font-size": ".6em",
                    "line-height": "1em",
                    "padding-bottom": ".5em",
                    "color": "#30e2d5"
                }
            })
        }
    });
})(nx);
