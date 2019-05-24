(function(nx) {
    var EXPORT = nx.define("nx.lib.DefaultApplication", nx.ui.Element, {
        properties: {
            size: {
                watcher: function(pname, size) {
                    this.release("size");
                    if (size) {
                        this.retain("size", nx.ready(function() {
                            var fsize = this.getGlobalFontSizeByPageSize(size);
                            if (fsize) {
                                nx.util.cssstyle.set(document.documentElement, "font-size", fsize + "px");
                                this.setStyle("font-size", fsize + "px");
                            } else {
                                nx.util.cssstyle.remove(document.documentElement, "font-size");
                                this.removeStyle("font-size");
                            }
                        }.bind(this)));
                    }
                }
            }
        },
        methods: {
            init: function() {
                this.inherited("nx-app");
                this.retain(this.syncViewScale());
                if (!EXPORT.CSS_GLOBAL) {
                    EXPORT.CSS_GLOBAL = nx.util.csssheet.create({
                        "html": {
                            "height": "100%"
                        },
                        "body": {
                            "margin": "0",
                            "padding": "0",
                            "height": "100%",
                            "color": "#b3b3b3",
                            "font-family": "'Roboto'",
                            "user-select": "none"
                        }
                    });
                }
            },
            syncViewScale: function() {
                var self = this;
                var listener = function(evt) {
                    self.size({
                        width: global.innerWidth,
                        height: global.innerHeight
                    });
                };
                global.addEventListener("resize", listener);
                this.size({
                    width: global.innerWidth,
                    height: global.innerHeight
                });
                return {
                    release: function() {
                        global.removeEventListener("resize", listener);
                    }
                };
            },
            getGlobalFontSizeByPageSize: function(size) {
                return 0;
            }
        }
    });
})(nx);
