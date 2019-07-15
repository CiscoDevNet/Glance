(function (nx) {
    var rId = /^\?id=(.*)$/;
    var EXPORT = nx.define("devme.check.Application", {
        properties: {
            service: {},
            view: {}
        },
        methods: {
            start: function () {
                this.service(new glance.common.ServiceCheck());
                this.view(new devme.check.ApplicationView());
                this._syncViewScaleResource = this.syncViewScale();
                // attach main view
                this.view().setStyle("transition", "1s");
                this.view().setStyle("opacity", "0");
                this.view().appendTo(document.body);
                setTimeout(function () {
                    this.view().setStyle("opacity", "1");
                    this.view().input && this.view().input().focus();
                }.bind(this), 1);
            },
            stop: function () {
                this._syncViewScaleResource.release();
            },
            syncViewScale: function () {
                var listener = this._updateViewScaleListener.bind(this);
                global.addEventListener("resize", listener);
                this._updateViewScale({
                    width: global.innerWidth,
                    height: global.innerHeight
                });
                return {
                    release: function () {
                        global.removeEventListener("resize", listener);
                    }
                };
            },
            _updateViewScaleListener: function (evt) {
                this._updateViewScale({
                    width: global.innerWidth,
                    height: global.innerHeight
                });
            },
            _updateViewScale: function (size) {
                var view = this.view();
                var fsize = Math.min(size.width / 20, size.height / 32);
                document.documentElement.style.fontSize = fsize + "px";
                view.setStyle("font-size", fsize + "px");
            }
        },
        statics: {
            CSS_FONTS: [nx.util.csssheet.create({
                "@font-face": {
                    "src": "url('font/CiscoScreenPRORegular_0830.ttf')",
                    "font-family": "CiscoScreenPRO"
                }
            }), nx.util.csssheet.create({
                "@font-face": {
                    "src": "url('font/CiscoScreenPROLight_0830.ttf')",
                    "font-family": "CiscoScreenPRO",
                    "font-weight": "light"
                }
            }), nx.util.csssheet.create({
                "@font-face": {
                    "src": "url('font/CiscoScreenPROBold_0830.ttf')",
                    "font-family": "CiscoScreenPRO",
                    "font-weight": "bold"
                }
            }), nx.util.csssheet.create({
                "@font-face": {
                    "src": "url('font/euron.ttf')",
                    "font-family": "euron"
                }
            })],
            CSS_GLOBAL: nx.util.csssheet.create({
                "html": {
                    "margin": "0",
                    "padding": "0"
                },
                "body": {
                    "font-family": "'Roboto'",
                    "user-select": "none"
                },
                "hr": {
                    "margin-top": "1.5em",
                    "margin-bottom": "1.5em",
                    "border-top-color": "#e6e6e6",
                    "border-top-width": ".2em"
                }
            })
        }
    });

    global.app = new EXPORT();
    nx.ready(function () {
        global.app.start();
    });
})(nx);
