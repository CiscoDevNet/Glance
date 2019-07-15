(function (nx) {
    var EXPORT = nx.define("devme.manage.Application", nx.ui.Element, {
        view: {
            cssclass: "app",
            content: [{
                type: "devme.manage.login.Login",
                cssstyle: {
                    display: nx.binding("credential", function (credential) {
                        return credential ? "none" : "block";
                    })
                },
                events: {
                    success: function (sender, credential) {
                        this.credential(credential);
                    }
                }
            }, {
                type: "devme.manage.main.Main",
                cssstyle: {
                    display: nx.binding("credential", function (credential) {
                        return credential ? "block" : "none";
                    })
                },
                events: {
                    logout: function () {
                        this.credential(null);
                    }
                }
            }]
        },
        properties: {
            model: null,
            credential: null
        },
        methods: {
            init: function () {
                this.inherited();
                // init model here
                // init font size here
                this.syncViewScale();
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
                var fsize = Math.min(size.width / 2560, size.height / 1600) * 30 + "px";
                nx.util.cssstyle.set(document.body, "font-size", fsize);
                this.setStyle("font-size", fsize);
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
                    "height": "100%"
                },
                "body": {
                    "margin": "0",
                    "padding": "0",
                    "height": "100%",
                    "color": "#b3b3b3",
                    "font-family": "'Roboto'",
                    "user-select": "none"
                },
                "hr": {
                    "margin-top": "1.5em",
                    "margin-bottom": "1.5em",
                    "border-top-color": "#e6e6e6",
                    "border-top-width": ".2em"
                }
            }),
            CSS: nx.util.csssheet.create({
                ".app": {
                    "position": "fixed",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "bottom": "0px"
                }
            })
        }
    });

    nx.ready(EXPORT);
})(nx);
