(function (nx) {
    var EXPORT = nx.define("devme.manage.login.Login", nx.ui.Element, {
        view: {
            cssclass: "glance-login",
            content: {
                type: "devme.manage.login.LoginForm",
                events: {
                    success: function (sender, credential) {
                        this.fire("success", credential);
                    }
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-login": {
                    "font-size": "2em",
                    "position": "absolute",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "bottom": "0px",
                    "background": "radial-gradient(#3a709c, #000610)",
                    "background-image": "url('glance/bg.png')",
                    "background-size": "100% 100%"
                }
            })
        }
    });
})(nx);
