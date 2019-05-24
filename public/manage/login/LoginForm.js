(function (nx) {
    var EXPORT = nx.define("devme.manage.login.LoginForm", nx.ui.Element, {
        view: {
            cssclass: "glance-login-form",
            content: [{
                type: "glance.common.BrandGlance",
                cssclass: "brand"
            }, {
                cssclass: "inputs",
                content: [{
                    name: "username",
                    type: "nx.lib.component.NormalInput",
                    properties: {
                        placeholder: "User ID"
                    }
                }, {
                    name: "password",
                    type: "nx.lib.component.NormalInput",
                    properties: {
                        password: true,
                        placeholder: "Password"
                    }
                }]
            }, {
                cssclass: "submit",
                content: "LOG IN",
                events: {
                    click: function () {
                        // TODO
                        this.fire("success", {
                            name: this.username().value()
                        });
                    }
                }
            }]
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-login-form": {
                    "position": "absolute",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "bottom": "0px",
                    "margin": "auto",
                    "width": "15em",
                    "height": "12em",
                    "border-radius": "1em",
                },
                ".glance-login-form > .brand": {
                    "display": "block",
                    "margin": "auto",
                    "margin-bottom": "2em",
                    "height": "2em"
                },
                ".glance-login-form > .inputs": {
                    "display": "block",
                    "background": "rgba(255, 255, 255, .7)",
                    "margin": "auto",
                    "padding": ".5em",
                    "border-radius": ".5em"
                },
                ".glance-login-form > .inputs > .nx-normal-input": {
                    "display": "block",
                    "margin": "auto",
                    "padding-bottom": ".5em",
                    "width": "13em",
                    "height": "2em"
                },
                ".glance-login-form > .inputs > .nx-normal-input:first-child": {
                    "border-bottom": "1px solid #666"
                },
                ".glance-login-form > .submit": {
                    "display": "block",
                    "width": "100%",
                    "height": "2em",
                    "line-height": "2em",
                    "margin-top": "1em",
                    "text-align": "center",
                    "border-radius": "0.5em",
                    "background": "#30e2d5",
                    "color": "rgba(0,0,0,.2)"
                }
            })
        }
    });
})(nx);
