(function (nx) {
    var EXPORT = nx.define("devme.admin.ExpertRegister", nx.ui.Element, {
        events: ["close"],
        view: {
            cssclass: "glance-expert-register",
            cssstyle: {
                display: nx.binding("global.app.service.page", function (page) {
                    return page === "user-register" ? "block" : "none";
                })
            },
            content: [{
                name: "form",
                type: "devme.admin.ExpertRegisterForm",
                properties: {
                    message: nx.binding("message")
                },
                events: {
                    close: "close"
                }
            }]
        },
        properties: {
            message: "Fill out the fields to add a new expert to GLANCE database"
        },
        methods: {
            reset: function () {
                this.form().dom().reset();
            },
            close: function () {
                this.message("Fill out the fields to add a new expert to GLANCE database");
                this.fire("close");
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-expert-register": {
                    "font-size": ".5em",
                    "color": "black"
                }
            })
        }
    });
})(nx);
